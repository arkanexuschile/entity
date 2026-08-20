import { prisma } from "@entity/database";

// ============================================================
// PIPELINE RECOLECTOR — el Hub NO genera documentos; los ingiere.
// Fuentes: Lorien (DTE emitidas), Defontana (OC), Shopify (pedidos).
// En esta fase se usa con payloads simulados (seed / API mock);
// en Fase B los adaptadores reales llaman a estas funciones.
// ============================================================

export interface LineaIngestida {
  itemCode: string;
  qty: number;
  rate: number;
}

export interface FacturaIngestida {
  name: string;
  postingDate: Date;
  customerTaxId: string;
  customerName: string;
  lines: LineaIngestida[];
  utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  sourceName?: string; // web | pos
  currency?: string;
}

export interface CompraIngestida {
  name: string;
  postingDate: Date;
  supplierTaxId: string;
  supplierName: string;
  lines: LineaIngestida[];
  currency?: string;
}

export class IngestError extends Error {}

async function ensureCustomer(companyId: string, taxId: string, name: string) {
  let customer = await prisma.customer.findFirst({
    where: { companyId, taxId },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: `CUST-${taxId.replace(/\D/g, "")}`, customerName: name, taxId, companyId },
    });
  }
  return customer;
}

async function ensureSupplier(companyId: string, taxId: string, name: string) {
  let supplier = await prisma.supplier.findFirst({
    where: { companyId, taxId },
  });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: { name: `SUP-${taxId.replace(/\D/g, "")}`, supplierName: name, taxId, companyId },
    });
  }
  return supplier;
}

async function resolveItem(companyId: string, itemCode: string) {
  const item = await prisma.item.findUnique({
    where: { companyId_itemCode: { companyId, itemCode } },
  });
  if (!item) {
    throw new IngestError(`Ítem desconocido: ${itemCode}. Registralo primero o sincroniza el catálogo.`);
  }
  return item;
}

async function findCompany() {
  return prisma.company.findFirstOrThrow();
}

async function findWarehouse(companyId: string) {
  return prisma.warehouse.findFirstOrThrow({ where: { companyId } });
}

export async function ingerirFactura(doc: FacturaIngestida) {
  const log = await prisma.ingestLog.create({ data: { source: "Lorien" } });
  try {
    const company = await findCompany();
    const warehouse = await findWarehouse(company.id);
    const customer = await ensureCustomer(company.id, doc.customerTaxId, doc.customerName);
    const existing = await prisma.salesInvoice.findUnique({
      where: { companyId_name: { companyId: company.id, name: doc.name } },
    });
    if (existing) throw new IngestError(`Factura ${doc.name} ya fue ingerida.`);

    const items: Array<{ itemId: string; qty: number; rate: number; amount: number; warehouseId: string }> = [];
    let netTotal = 0;
    for (const l of doc.lines) {
      const item = await resolveItem(company.id, l.itemCode);
      const amount = l.qty * l.rate;
      netTotal += amount;
      items.push({ itemId: item.id, qty: l.qty, rate: l.rate, amount, warehouseId: warehouse.id });
    }

    const iva = await prisma.taxTemplate.findFirstOrThrow({ where: { companyId: company.id, isVat: true } });
    const totalTax = netTotal * (Number(iva.rate) / 100);
    const grandTotal = netTotal + totalTax;

    let campaignId: string | null = null;
    if (doc.utm?.campaign) {
      const campaign = await prisma.campaign.findFirst({
        where: { name: { contains: doc.utm.campaign, mode: "insensitive" } },
      });
      campaignId = campaign?.id ?? null;
    }

    await prisma.salesInvoice.create({
      data: {
        name: doc.name,
        postingDate: doc.postingDate,
        status: "Paid",
        customerId: customer.id,
        warehouseId: warehouse.id,
        companyId: company.id,
        netTotal,
        totalTax,
        grandTotal,
        utmSource: doc.utm?.source,
        utmMedium: doc.utm?.medium,
        utmCampaign: doc.utm?.campaign,
        utmTerm: doc.utm?.term,
        utmContent: doc.utm?.content,
        sourceName: doc.sourceName,
        campaignId,
        items: { create: items },
      },
    });

    // Stock FIFO: salida contra el balance vigente
    for (const l of items) {
      const ledger = await prisma.stockLedgerEntry.findFirst({
        where: { itemId: l.itemId, warehouseId: warehouse.id, isCancelled: false },
        orderBy: { postingDate: "desc" },
      });
      const balQty = Number(ledger?.balanceQty ?? 0);
      const balValue = Number(ledger?.balanceValue ?? 0);
      const costPerUnit = balQty > 0 ? balValue / balQty : l.rate;
      const cogs = l.qty * costPerUnit;
      const newQty = balQty - l.qty;
      const newValue = newQty <= 0 ? 0 : balValue - cogs;

      await prisma.stockLedgerEntry.create({
        data: {
          postingDate: doc.postingDate,
          itemId: l.itemId,
          warehouseId: warehouse.id,
          actualQty: -l.qty,
          valuationRate: costPerUnit,
          stockValue: -cogs,
          balanceQty: newQty,
          balanceValue: newValue,
          voucherType: "SalesInvoice",
          voucherNo: doc.name,
          companyId: company.id,
        },
      });
    }

    // Asientos
    const [ventasAcct, cajaAcct, ivaDebAcct, costoAcct, existAcct] = await Promise.all([
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "Ventas" } }),
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "Caja" } }),
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "IVA Debito Fiscal" } }),
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "Costo de Venta" } }),
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "Existencias" } }),
    ]);

    await prisma.glEntry.createMany({
      data: [
        { postingDate: doc.postingDate, accountId: cajaAcct.id, debit: grandTotal, credit: 0, voucherType: "SalesInvoice", voucherNo: doc.name, companyId: company.id },
        { postingDate: doc.postingDate, accountId: ventasAcct.id, debit: 0, credit: netTotal, voucherType: "SalesInvoice", voucherNo: doc.name, companyId: company.id },
        { postingDate: doc.postingDate, accountId: ivaDebAcct.id, debit: 0, credit: totalTax, voucherType: "SalesInvoice", voucherNo: doc.name, companyId: company.id },
      ],
    });

    await prisma.ingestLog.update({
      where: { id: log.id },
      data: { status: "Done", docsCount: 1, finishedAt: new Date() },
    });
    return { name: doc.name, netTotal, grandTotal };
  } catch (e) {
    await prisma.ingestLog.update({
      where: { id: log.id },
      data: { status: "Failed", message: e instanceof Error ? e.message : String(e), finishedAt: new Date() },
    });
    throw e;
  }
}

export async function ingerirCompra(doc: CompraIngestida) {
  const log = await prisma.ingestLog.create({ data: { source: "Defontana" } });
  try {
    const company = await findCompany();
    const warehouse = await findWarehouse(company.id);
    const supplier = await ensureSupplier(company.id, doc.supplierTaxId, doc.supplierName);
    const existing = await prisma.purchaseInvoice.findUnique({
      where: { companyId_name: { companyId: company.id, name: doc.name } },
    });
    if (existing) throw new IngestError(`Compra ${doc.name} ya fue ingerida.`);

    const items: Array<{ itemId: string; qty: number; rate: number; amount: number; warehouseId: string }> = [];
    let netTotal = 0;
    for (const l of doc.lines) {
      const item = await resolveItem(company.id, l.itemCode);
      const amount = l.qty * l.rate;
      netTotal += amount;
      items.push({ itemId: item.id, qty: l.qty, rate: l.rate, amount, warehouseId: warehouse.id });
    }

    const iva = await prisma.taxTemplate.findFirstOrThrow({ where: { companyId: company.id, isVat: true } });
    const totalTax = netTotal * (Number(iva.rate) / 100);
    const grandTotal = netTotal + totalTax;

    await prisma.purchaseInvoice.create({
      data: {
        name: doc.name,
        postingDate: doc.postingDate,
        status: "Paid",
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        companyId: company.id,
        netTotal,
        totalTax,
        grandTotal,
        items: { create: items },
      },
    });

    // Stock FIFO: entrada
    for (const l of items) {
      const ledger = await prisma.stockLedgerEntry.findFirst({
        where: { itemId: l.itemId, warehouseId: warehouse.id, isCancelled: false },
        orderBy: { postingDate: "desc" },
      });
      const balQty = Number(ledger?.balanceQty ?? 0);
      const balValue = Number(ledger?.balanceValue ?? 0);
      const newQty = balQty + l.qty;
      const newValue = balValue + l.qty * l.rate;

      await prisma.stockLedgerEntry.create({
        data: {
          postingDate: doc.postingDate,
          itemId: l.itemId,
          warehouseId: warehouse.id,
          actualQty: l.qty,
          valuationRate: l.rate,
          stockValue: l.qty * l.rate,
          balanceQty: newQty,
          balanceValue: newValue,
          voucherType: "PurchaseInvoice",
          voucherNo: doc.name,
          companyId: company.id,
        },
      });
    }

    // Asientos
    const [existAcct, ivaCredAcct, cajaAcct] = await Promise.all([
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "Existencias" } }),
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "IVA Credito Fiscal" } }),
      prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "Caja" } }),
    ]);

    await prisma.glEntry.createMany({
      data: [
        { postingDate: doc.postingDate, accountId: existAcct.id, debit: netTotal, credit: 0, voucherType: "PurchaseInvoice", voucherNo: doc.name, companyId: company.id },
        { postingDate: doc.postingDate, accountId: ivaCredAcct.id, debit: totalTax, credit: 0, voucherType: "PurchaseInvoice", voucherNo: doc.name, companyId: company.id },
        { postingDate: doc.postingDate, accountId: cajaAcct.id, debit: 0, credit: grandTotal, voucherType: "PurchaseInvoice", voucherNo: doc.name, companyId: company.id },
      ],
    });

    await prisma.ingestLog.update({
      where: { id: log.id },
      data: { status: "Done", docsCount: 1, finishedAt: new Date() },
    });
    return { name: doc.name, netTotal, grandTotal };
  } catch (e) {
    await prisma.ingestLog.update({
      where: { id: log.id },
      data: { status: "Failed", message: e instanceof Error ? e.message : String(e), finishedAt: new Date() },
    });
    throw e;
  }
}