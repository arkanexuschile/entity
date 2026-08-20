import {
  PrismaClient,
  RootType,
  AccountType,
  RoleName,
  CampaignChannel,
  TaskStatus,
  TaskPriority,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Módulos del Hub para permisos
const MODULES = ["ventas", "compras", "inventario", "finanzas", "campanas", "tareas", "contabilidad", "reportes", "admin", "carritos"] as const;

// Defaults por rol: V=ver, E=editar
const ROLE_DEFAULTS: Record<string, Record<string, { canView: boolean; canEdit: boolean }>> = {
  [RoleName.ADMIN]: Object.fromEntries(MODULES.map((m) => [m, { canView: true, canEdit: true }])),
  [RoleName.MANAGER]: Object.fromEntries(MODULES.map((m) => [m, { canView: true, canEdit: m !== "admin" }])),
  [RoleName.FINANZAS]: { ventas: { canView: true, canEdit: false }, compras: { canView: true, canEdit: true }, inventario: { canView: true, canEdit: false }, finanzas: { canView: true, canEdit: true }, campanas: { canView: false, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: true, canEdit: true }, reportes: { canView: true, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: false, canEdit: false } },
  [RoleName.BODEGA]: { ventas: { canView: false, canEdit: false }, compras: { canView: true, canEdit: false }, inventario: { canView: true, canEdit: true }, finanzas: { canView: false, canEdit: false }, campanas: { canView: false, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: false, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: false, canEdit: false } },
  [RoleName.MARKETING]: { ventas: { canView: true, canEdit: false }, compras: { canView: false, canEdit: false }, inventario: { canView: true, canEdit: false }, finanzas: { canView: false, canEdit: false }, campanas: { canView: true, canEdit: true }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: true, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: true, canEdit: true } },
  [RoleName.DISENO]: { ventas: { canView: false, canEdit: false }, compras: { canView: false, canEdit: false }, inventario: { canView: false, canEdit: false }, finanzas: { canView: false, canEdit: false }, campanas: { canView: true, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: false, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: false, canEdit: false } },
  [RoleName.VENTAS]: { ventas: { canView: true, canEdit: true }, compras: { canView: false, canEdit: false }, inventario: { canView: true, canEdit: false }, finanzas: { canView: true, canEdit: false }, campanas: { canView: false, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: true, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: true, canEdit: true } },
};

// ============================================================
// SEED ENTITY — datos de demostración
// (campaigns, facturas con UTM, compras, asientos, stock FIFO,
//  métricas GA4 y tablón de misiones)
// ============================================================

const money = (n: number) => n;

async function main() {
  console.log("🌱 SEED ENTITY (demo)...");

  const company = await prisma.company.upsert({
    where: { name: "PiedraBruja SpA" },
    update: {},
    create: { name: "PiedraBruja SpA", abbr: "PBT", taxId: "76.123.456-7", currency: "CLP" },
  });
  console.log(`→ Compañía: ${company.name}`);

  async function account(
    name: string,
    rootType: RootType,
    accountType: AccountType,
    parentId: string | null,
    isGroup = false
  ) {
    return prisma.account.upsert({
      where: { companyId_name: { companyId: company.id, name } },
      update: {},
      create: { name, rootType, accountType, parentId, isGroup, companyId: company.id },
    });
  }

  const activo = await account("Activo", RootType.ASSET, AccountType.OTHER, null, true);
  const pasivo = await account("Pasivo", RootType.LIABILITY, AccountType.OTHER, null, true);
  const patrimonio = await account("Patrimonio", RootType.EQUITY, AccountType.EQUITY, null, true);
  const ingresos = await account("Ingresos", RootType.INCOME, AccountType.OTHER, null, true);
  const costos = await account("Costos y Gastos", RootType.EXPENSE, AccountType.OTHER, null, true);

  const caja = await account("Caja", RootType.ASSET, AccountType.CASH, activo.id);
  const cxc = await account("Cuentas por Cobrar", RootType.ASSET, AccountType.RECEIVABLE, activo.id);
  const existencias = await account("Existencias", RootType.ASSET, AccountType.STOCK, activo.id);
  const cxp = await account("Cuentas por Pagar", RootType.LIABILITY, AccountType.PAYABLE, pasivo.id);
  const ivaDebito = await account("IVA Debito Fiscal", RootType.LIABILITY, AccountType.TAX, pasivo.id);
  const ivaCredito = await account("IVA Credito Fiscal", RootType.ASSET, AccountType.TAX, activo.id);
  const capital = await account("Capital", RootType.EQUITY, AccountType.EQUITY, patrimonio.id);
  const ventas = await account("Ventas", RootType.INCOME, AccountType.INCOME, ingresos.id);
  const costoVenta = await account("Costo de Venta", RootType.EXPENSE, AccountType.EXPENSE, costos.id);

  const warehouse = await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: "Bodega Principal - PBT" } },
    update: {},
    create: { name: "Bodega Principal - PBT", companyId: company.id },
  });

  const iva = await prisma.taxTemplate.upsert({
    where: { companyId_name: { companyId: company.id, name: "IVA 19%" } },
    update: {},
    create: { name: "IVA 19%", rate: 19, isVat: true, accountId: ivaDebito.id, companyId: company.id },
  });

  await prisma.company.update({
    where: { id: company.id },
    data: {
      defaultWarehouseId: warehouse.id,
      defaultIncomeAccountId: ventas.id,
      defaultExpenseAccountId: (await prisma.account.findFirstOrThrow({ where: { companyId: company.id, name: "Costos y Gastos" } })).id,
      defaultCashAccountId: caja.id,
      defaultVatAccountId: ivaDebito.id,
    },
  });

  // -------------------- Ítems --------------------
  const itemDefs = [
    { itemCode: "STONE-001", itemName: "Piedra Bruta", rate: 100000, standardRate: 250000, group: "Piedra" },
    { itemCode: "STONE-002", itemName: "Piedra Pulida", rate: 120000, standardRate: 300000, group: "Piedra" },
    { itemCode: "STONE-003", itemName: "Piedra Premium", rate: 180000, standardRate: 450000, group: "Piedra" },
    { itemCode: "AMULET-001", itemName: "Amuleto de Luna", rate: 90000, standardRate: 220000, group: "Amuleto" },
    { itemCode: "AMULET-002", itemName: "Amuleto del Forjador", rate: 110000, standardRate: 280000, group: "Amuleto" },
    { itemCode: "RING-001", itemName: "Anillo de Ceniza", rate: 60000, standardRate: 150000, group: "Joyería" },
    { itemCode: "CARV-001", itemName: "Figura Tallada", rate: 70000, standardRate: 180000, group: "Tallado" },
  ];

  const items = new Map<string, string>();
  for (const it of itemDefs) {
    const item = await prisma.item.upsert({
      where: { companyId_itemCode: { companyId: company.id, itemCode: it.itemCode } },
      update: {},
      create: {
        itemCode: it.itemCode,
        itemName: it.itemName,
        itemGroup: it.group,
        rate: money(it.rate),
        standardRate: money(it.standardRate),
        valuationMethod: "FIFO",
        companyId: company.id,
      },
    });
    items.set(it.itemCode, item.id);
  }
  console.log(`→ Ítems: ${itemDefs.length}`);

  // -------------------- Usuarios --------------------
  const hash = await bcrypt.hash("entity123", 10);
  const userDefs = [
    { email: "admin@entity.local", name: "Administrador", role: RoleName.ADMIN },
    { email: "mille@entity.local", name: "Mille", role: RoleName.MANAGER },
    { email: "marketing@entity.local", name: "Campañas", role: RoleName.MARKETING },
    { email: "bodega@entity.local", name: "Bodega", role: RoleName.BODEGA },
    { email: "diseno@entity.local", name: "Diseño", role: RoleName.DISENO },
  ];
  const userIds = new Map<string, string>();
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hash, name: u.name, role: u.role, active: true },
      create: { email: u.email, name: u.name, passwordHash: hash, role: u.role },
    });
    userIds.set(u.email, user.id);

    // Permisos por módulo: defaults del rol
    const defaults = ROLE_DEFAULTS[u.role] ?? ROLE_DEFAULTS[RoleName.VENTAS];
    for (const m of MODULES) {
      const perm = defaults[m] ?? { canView: false, canEdit: false };
      await prisma.userModulePermission.upsert({
        where: { userId_module: { userId: user.id, module: m } },
        update: {},
        create: { userId: user.id, module: m, canView: perm.canView, canEdit: perm.canEdit },
      });
    }
  }
  console.log(`→ Usuarios: ${userDefs.length} (pass: entity123)`);

  // -------------------- Partes: clientes y proveedores --------------------
  const customers = [
    { name: "CUST-00001", customerName: "Aurora Canales", taxId: "11.222.333-4", email: "aurora@correo.cl" },
    { name: "CUST-00002", customerName: "Marcelo Rivas", taxId: "22.333.444-5", email: "marcelo@correo.cl" },
    { name: "CUST-00003", customerName: "Teresa Vidal", taxId: "33.444.555-6", email: "teresa@correo.cl" },
    { name: "CUST-00004", customerName: "Ignacio Soto", taxId: "44.555.666-7", email: "ignacio@correo.cl" },
    { name: "CUST-00005", customerName: "Cristina Lagos", taxId: "55.666.777-8", email: "cristina@correo.cl" },
    { name: "CUST-00006", customerName: "Rafael Fuentes", taxId: "66.777.888-9", email: "rafael@correo.cl" },
  ];
  const customerIds: string[] = [];
  for (const c of customers) {
    const cust = await prisma.customer.upsert({
      where: { companyId_name: { companyId: company.id, name: c.name } },
      update: {},
      create: { ...c, companyId: company.id },
    });
    customerIds.push(cust.id);
  }

  const suppliers = [
    { name: "SUP-00001", supplierName: "Cantera del Sur", taxId: "77.111.222-3", email: "ventas@cantera.cl" },
    { name: "SUP-00002", supplierName: "Herramientas Férreas", taxId: "88.222.333-4", email: "pedidos@ferreo.cl" },
  ];
  const supplierIds: string[] = [];
  for (const s of suppliers) {
    const sup = await prisma.supplier.upsert({
      where: { companyId_name: { companyId: company.id, name: s.name } },
      update: {},
      create: { ...s, companyId: company.id },
    });
    supplierIds.push(sup.id);
  }
  console.log(`→ Clientes: ${customerIds.length}, Proveedores: ${supplierIds.length}`);

  // -------------------- Campañas de marketing --------------------
  const campaigns = [
    {
      name: "Invierno Rúnico",
      channel: CampaignChannel.META,
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-06-30"),
      budget: 400000,
      spend: 385000,
      items: ["AMULET-001", "AMULET-002"],
    },
    {
      name: "Forja Viva",
      channel: CampaignChannel.GOOGLE,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-07-31"),
      budget: 350000,
      spend: 310000,
      items: ["RING-001", "CARV-001"],
    },
    {
      name: "Piedra Ancestral",
      channel: CampaignChannel.SHOPIFY,
      startDate: new Date("2026-07-01"),
      endDate: null,
      budget: 250000,
      spend: 172000,
      items: ["STONE-003"],
    },
    {
      name: "Alquimia Digital",
      channel: CampaignChannel.GOOGLE,
      startDate: new Date("2026-07-15"),
      endDate: null,
      budget: 300000,
      spend: 148000,
      items: ["STONE-001", "STONE-002", "AMULET-001"],
    },
  ];

  const campaignIds = new Map<string, string>();
  for (const c of campaigns) {
    const campaign = await prisma.campaign.upsert({
      where: { id: `campaign-${c.name.toLowerCase().replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `campaign-${c.name.toLowerCase().replace(/\s/g, "-")}`,
        name: c.name,
        channel: c.channel,
        startDate: c.startDate,
        endDate: c.endDate,
        budget: money(c.budget),
        spend: money(c.spend),
      },
    });
    campaignIds.set(c.name, campaign.id);

    for (const code of c.items) {
      const itemId = items.get(code);
      if (itemId) {
        await prisma.campaignItem.upsert({
          where: { campaignId_itemId: { campaignId: campaign.id, itemId } },
          update: {},
          create: { campaignId: campaign.id, itemId },
        });
      }
    }
  }
  console.log(`→ Campañas: ${campaigns.length}`);

  // -------------------- Compras (para stock FIFO) --------------------
  const purchaseDefs: Array<{ name: string; date: string; supplierIdx: number; lines: Array<[string, number, number]> }> = [
    { name: "OC-00001", date: "2026-05-05", supplierIdx: 0, lines: [["STONE-001", 100, 100], ["STONE-002", 80, 120]] },
    { name: "OC-00002", date: "2026-06-05", supplierIdx: 1, lines: [["RING-001", 60, 60], ["CARV-001", 40, 70]] },
    { name: "OC-00003", date: "2026-07-05", supplierIdx: 0, lines: [["STONE-003", 50, 180], ["AMULET-001", 80, 90], ["AMULET-002", 60, 110]] },
  ];

  let saleNo = 0;
  const nextSaleName = () => {
    saleNo += 1;
    return `FV-${String(saleNo).padStart(5, "0")}`;
  };

  for (const p of purchaseDefs) {
    const existing = await prisma.purchaseInvoice.findUnique({
      where: { companyId_name: { companyId: company.id, name: p.name } },
    });
    if (existing) continue;

    const postingDate = new Date(p.date);
    let netTotal = 0;
    let totalTax = 0;
    let grandTotal = 0;
    const lines = p.lines.map(([code, qty, rate]) => {
      const amount = qty * rate;
      netTotal += amount;
      totalTax += amount * 0.19;
      grandTotal = netTotal + totalTax;
      return { itemId: items.get(code)!, qty, rate, amount, warehouseId: warehouse.id };
    });

    const purchase = await prisma.purchaseInvoice.create({
      data: {
        name: p.name,
        postingDate,
        status: "Paid",
        supplierId: supplierIds[p.supplierIdx],
        warehouseId: warehouse.id,
        companyId: company.id,
        netTotal: money(netTotal),
        totalTax: money(totalTax),
        grandTotal: money(grandTotal),
        items: { create: lines },
      },
    });

    // Asientos de compra: Existencias + IVA Crédito | Caja
    await prisma.glEntry.createMany({
      data: [
        { postingDate, accountId: existencias.id, debit: money(netTotal), credit: 0, voucherType: "PurchaseInvoice", voucherNo: p.name, companyId: company.id },
        { postingDate, accountId: ivaCredito.id, debit: money(totalTax), credit: 0, voucherType: "PurchaseInvoice", voucherNo: p.name, companyId: company.id },
        { postingDate, accountId: caja.id, debit: 0, credit: money(grandTotal), voucherType: "PurchaseInvoice", voucherNo: p.name, companyId: company.id },
      ],
    });

    // Stock FIFO: entrada
    for (const line of lines) {
      const it = itemDefs.find((i) => items.get(i.itemCode) === line.itemId)!;
      await prisma.stockLedgerEntry.create({
        data: {
          postingDate,
          itemId: line.itemId,
          warehouseId: warehouse.id,
          actualQty: money(line.qty),
          valuationRate: money(it.rate!),
          stockValue: money(line.qty * it.rate!),
          balanceQty: money(line.qty),
          balanceValue: money(line.qty * it.rate!),
          voucherType: "PurchaseInvoice",
          voucherNo: p.name,
          companyId: company.id,
        },
      });
    }
  }
  console.log(`→ Compras: ${purchaseDefs.length}`);

  // -------------------- Facturas de venta con UTM (atribución) --------------------
  const saleDefs: Array<{
    date: string;
    customerIdx: number;
    lines: Array<[string, number]>;
    utm: { source: string; medium: string; campaign: string; sourceName: string };
    campaign?: string;
  }> = [
    { date: "2026-05-12", customerIdx: 0, campaign: "Invierno Rúnico", utm: { source: "facebook", medium: "cpc", campaign: "invierno-runico", sourceName: "web" }, lines: [["AMULET-001", 2], ["AMULET-002", 1]] },
    { date: "2026-05-18", customerIdx: 1, campaign: "Invierno Rúnico", utm: { source: "facebook", medium: "cpc", campaign: "invierno-runico", sourceName: "web" }, lines: [["AMULET-001", 1]] },
    { date: "2026-05-25", customerIdx: 2, utm: { source: "direct", medium: "none", campaign: "", sourceName: "web" }, lines: [["STONE-001", 3]] },
    { date: "2026-06-03", customerIdx: 3, campaign: "Invierno Rúnico", utm: { source: "instagram", medium: "cpc", campaign: "invierno-runico", sourceName: "web" }, lines: [["AMULET-002", 2], ["AMULET-001", 1]] },
    { date: "2026-06-09", customerIdx: 4, campaign: "Forja Viva", utm: { source: "google", medium: "cpc", campaign: "forja-viva", sourceName: "web" }, lines: [["RING-001", 3], ["CARV-001", 1]] },
    { date: "2026-06-15", customerIdx: 5, campaign: "Forja Viva", utm: { source: "google", medium: "cpc", campaign: "forja-viva", sourceName: "web" }, lines: [["RING-001", 2]] },
    { date: "2026-06-22", customerIdx: 0, utm: { source: "pos", medium: "none", campaign: "", sourceName: "pos" }, lines: [["STONE-002", 2]] },
    { date: "2026-06-28", customerIdx: 1, campaign: "Forja Viva", utm: { source: "google", medium: "cpc", campaign: "forja-viva", sourceName: "web" }, lines: [["CARV-001", 2], ["RING-001", 1]] },
    { date: "2026-07-04", customerIdx: 2, campaign: "Piedra Ancestral", utm: { source: "shopify", medium: "cpc", campaign: "piedra-ancestral", sourceName: "web" }, lines: [["STONE-003", 2]] },
    { date: "2026-07-10", customerIdx: 3, campaign: "Piedra Ancestral", utm: { source: "shopify", medium: "cpc", campaign: "piedra-ancestral", sourceName: "web" }, lines: [["STONE-003", 1], ["AMULET-001", 2]] },
    { date: "2026-07-16", customerIdx: 4, campaign: "Alquimia Digital", utm: { source: "google", medium: "cpc", campaign: "alquimia-digital", sourceName: "web" }, lines: [["STONE-001", 4], ["STONE-002", 2]] },
    { date: "2026-07-22", customerIdx: 5, utm: { source: "pos", medium: "none", campaign: "", sourceName: "pos" }, lines: [["STONE-003", 1]] },
    { date: "2026-07-28", customerIdx: 0, campaign: "Alquimia Digital", utm: { source: "google", medium: "cpc", campaign: "alquimia-digital", sourceName: "web" }, lines: [["AMULET-001", 3]] },
    { date: "2026-08-02", customerIdx: 1, campaign: "Piedra Ancestral", utm: { source: "shopify", medium: "cpc", campaign: "piedra-ancestral", sourceName: "web" }, lines: [["STONE-003", 2]] },
    { date: "2026-08-08", customerIdx: 2, campaign: "Alquimia Digital", utm: { source: "google", medium: "cpc", campaign: "alquimia-digital", sourceName: "web" }, lines: [["STONE-002", 3], ["AMULET-001", 1]] },
    { date: "2026-08-14", customerIdx: 3, utm: { source: "direct", medium: "none", campaign: "", sourceName: "web" }, lines: [["RING-001", 2]] },
  ];

  let stockBalances = new Map<string, { qty: number; value: number }>();
  const prevLedger = await prisma.stockLedgerEntry.findMany();
  for (const e of prevLedger) {
    stockBalances.set(e.itemId, { qty: Number(e.balanceQty), value: Number(e.balanceValue) });
  }

  let createdSales = 0;
  const firstSale = await prisma.salesInvoice.findUnique({
    where: { companyId_name: { companyId: company.id, name: nextSaleName() } },
  });
  if (firstSale) {
    console.log(`→ Facturas de venta ya existentes — omitiendo (${saleNo})`);
    createdSales = saleNo;
  } else {
  for (const s of saleDefs) {
    const name = nextSaleName();
    const postingDate = new Date(s.date);

    let netTotal = 0;
    let totalTax = 0;
    const lines: Array<{ itemId: string; qty: number; rate: number; amount: number; warehouseId: string }> = [];
    const lineCosts: number[] = [];

    for (const [code, qty] of s.lines) {
      const itemId = items.get(code)!;
      const it = itemDefs.find((i) => items.get(i.itemCode) === itemId)!;
      const rate = it.standardRate!;
      const amount = qty * rate;
      netTotal += amount;
      totalTax += amount * 0.19;
      lines.push({ itemId, qty, rate, amount, warehouseId: warehouse.id });

      // COGS FIFO: consumir el balance de stock existente (costos de entrada)
      const bal = stockBalances.get(itemId) ?? { qty: 0, value: 0 };
      const consumed = Math.min(qty, bal.qty);
      const consumedCost = bal.qty > 0 ? (bal.value / bal.qty) * consumed : it.rate! * consumed;
      lineCosts.push(consumedCost);
      const newQty = bal.qty - consumed;
      const newValue = bal.qty > 0 ? bal.value - consumedCost : 0;
      stockBalances.set(itemId, { qty: newQty, value: newValue });

      await prisma.stockLedgerEntry.create({
        data: {
          postingDate,
          itemId,
          warehouseId: warehouse.id,
          actualQty: money(-qty),
          valuationRate: money(it.rate!),
          stockValue: money(-consumedCost),
          balanceQty: money(newQty),
          balanceValue: money(newValue),
          voucherType: "SalesInvoice",
          voucherNo: name,
          companyId: company.id,
        },
      });
    }

    const grandTotal = netTotal + totalTax;
    const cogs = lineCosts.reduce((a, b) => a + b, 0);

    await prisma.salesInvoice.create({
      data: {
        name,
        postingDate,
        status: "Paid",
        customerId: customerIds[s.customerIdx],
        warehouseId: warehouse.id,
        companyId: company.id,
        netTotal: money(netTotal),
        totalTax: money(totalTax),
        grandTotal: money(grandTotal),
        utmSource: s.utm.source,
        utmMedium: s.utm.medium,
        utmCampaign: s.utm.campaign || null,
        sourceName: s.utm.sourceName,
        campaignId: s.campaign ? campaignIds.get(s.campaign) ?? null : null,
        items: { create: lines },
      },
    });

    // Asientos de venta: Caja | Ventas + IVA; Costo de Venta | Existencias
    await prisma.glEntry.createMany({
      data: [
        { postingDate, accountId: caja.id, debit: money(grandTotal), credit: 0, voucherType: "SalesInvoice", voucherNo: name, companyId: company.id },
        { postingDate, accountId: ventas.id, debit: 0, credit: money(netTotal), voucherType: "SalesInvoice", voucherNo: name, companyId: company.id },
        { postingDate, accountId: ivaDebito.id, debit: 0, credit: money(totalTax), voucherType: "SalesInvoice", voucherNo: name, companyId: company.id },
        { postingDate, accountId: costoVenta.id, debit: money(cogs), credit: 0, voucherType: "SalesInvoice", voucherNo: name, companyId: company.id },
        { postingDate, accountId: existencias.id, debit: 0, credit: money(cogs), voucherType: "SalesInvoice", voucherNo: name, companyId: company.id },
      ],
    });

    createdSales += 1;
  }
  }
  console.log(`→ Facturas de venta: ${createdSales}`);

  // -------------------- Métricas GA4 por campaña --------------------
  const gaMetrics: Array<{ campaign: string; date: string; sessions: number; addToCart: number; checkouts: number; purchases: number; revenue: number }> = [
    { campaign: "Invierno Rúnico", date: "2026-05", sessions: 4200, addToCart: 480, checkouts: 210, purchases: 96, revenue: 2140000 },
    { campaign: "Forja Viva", date: "2026-06", sessions: 3800, addToCart: 402, checkouts: 188, purchases: 84, revenue: 1780000 },
    { campaign: "Piedra Ancestral", date: "2026-07", sessions: 2100, addToCart: 254, checkouts: 120, purchases: 58, revenue: 1460000 },
    { campaign: "Alquimia Digital", date: "2026-07", sessions: 2900, addToCart: 301, checkouts: 141, purchases: 66, revenue: 1310000 },
  ];
  const gaSources: Record<string, string> = {
    "Invierno Rúnico": "Meta",
    "Forja Viva": "Google",
    "Piedra Ancestral": "Shopify",
    "Alquimia Digital": "Google",
  };

  for (const m of gaMetrics) {
    const cid = campaignIds.get(m.campaign);
    if (!cid) continue;
    const [y, mo] = m.date.split("-").map(Number);
    await prisma.campaignMetric.upsert({
      where: { campaignId_date_source: { campaignId: cid, date: new Date(y, mo - 1, 15), source: gaSources[m.campaign] } },
      update: {},
      create: {
        campaignId: cid,
        date: new Date(y, mo - 1, 15),
        source: gaSources[m.campaign],
        sessions: m.sessions,
        addToCart: m.addToCart,
        checkouts: m.checkouts,
        purchases: m.purchases,
        revenue: money(m.revenue),
      },
    });
  }
  console.log(`→ Métricas GA4: ${gaMetrics.length}`);

  // -------------------- Tablón de misiones --------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromNow = (n: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + n);
    return d;
  };
  const taskDefs = [
    { title: "Definir naming UTM para campañas", board: "Marketing", status: TaskStatus.DONE, priority: TaskPriority.HIGH, dueDate: daysFromNow(-10), createdBy: "marketing@entity.local", assignee: "marketing@entity.local", description: "Acordar convención UTM para todas las campañas.\n\nFormato: utm_source (facebook/google/shopify), utm_medium (cpc/email), utm_campaign (slug sin tildes, ej. invierno-runico).\nDocumentar en Drive y validar con GA4." },
    { title: "Conectar sandbox de Defontana", board: "Integraciones", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT, dueDate: daysFromNow(2), createdBy: "mille@entity.local", assignee: "admin@entity.local", description: "Pedir credenciales sandbox a soporte Defontana.\n\nPasos:\n1. Solicitar usuario/clave de prueba\n2. Probar endpoint /api/pos con Postman\n3. Validar que devuelva stock y precios\nBloquea la ingesta de compras si no se resuelve." },
    { title: "API de Lorien: token de acceso", board: "Integraciones", status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: daysFromNow(6), createdBy: "mille@entity.local", assignee: "admin@entity.local", description: "Obtener token de acceso a la API de Lorien para ingesta de DTE.\n\nContactar a Lorien, solicitar API key de integración.\nEndpoints a probar: /dte/list y /dte/detail.\nGuardarlo en .env como LORIEN_API_KEY (no commitear)." },
    { title: "Catálogo Shopify: sync de productos", board: "Integraciones", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: null, createdBy: "marketing@entity.local", assignee: "bodega@entity.local", description: "Sincronizar catálogo de Shopify con el Hub.\n\nUsar Storefront API: traer title, handle, price, inventoryQuantity.\nMapear itemCode de Kotharia con SKU de Shopify.\nFrecuencia: diaria vía cron." },
    { title: "Dashboard de campañas: validar ROI", board: "Analítica", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: daysFromNow(1), createdBy: "mille@entity.local", assignee: "marketing@entity.local", description: "Revisar que el ROI por campaña cierre con los datos reales.\n\nComparar: spend (ads) vs revenue atribuido (UTM) en /campanas.\nSi hay discrepancia > 5%, revisar mapeo de campaignId en SalesInvoice.\nEl oráculo debería recomendar escalar/recortar según ROI." },
    { title: "Fotos de amuletos para la tienda", board: "Diseño", status: TaskStatus.BLOCKED, priority: TaskPriority.MEDIUM, dueDate: daysFromNow(4), createdBy: "marketing@entity.local", assignee: "diseno@entity.local", description: "Sesión de fotos para AMULET-001 y AMULET-002.\n\nBloqueada hasta conseguir fondo de terciopelo negro y luz lateral.\nEntregar: 3 fotos por producto (frente, detalle, lifestyle) en 2000x2000.\nCoordinar con Mille fecha de estudio." },
  ];

  for (let i = 0; i < taskDefs.length; i++) {
    const t = taskDefs[i];
    const existing = await prisma.task.findFirst({ where: { title: t.title } });
    if (!existing) {
      await prisma.task.create({
        data: {
          title: t.title,
          description: (t as { description?: string }).description ?? null,
          board: t.board,
          status: t.status,
          priority: t.priority,
          orderIndex: i,
          dueDate: t.dueDate,
          createdById: userIds.get(t.createdBy),
          assigneeId: userIds.get(t.assignee ?? ""),
        },
      });
    }
  }
  console.log(`→ Tareas: ${taskDefs.length}`);

  await prisma.ingestLog.create({
    data: { source: "Seed", status: "Done", docsCount: createdSales + purchaseDefs.length, message: "Seed demo aplicado" },
  });

  // -------------------- Carritos abandonados (Shopify) --------------------
  const abandonedDefs = [
    { shopifyCartId: "gid://shopify/Cart/1001", customerName: "Aurora Canales", email: "aurora@correo.cl", phone: "56912340001", items: [{ itemCode: "AMULET-001", itemName: "Amuleto de Luna", qty: 1, price: 220000 }], total: 220000, abandonedAt: daysFromNow(-1), status: "Pendiente" },
    { shopifyCartId: "gid://shopify/Cart/1002", customerName: "Marcelo Rivas", email: "marcelo@correo.cl", phone: "56912340002", items: [{ itemCode: "STONE-003", itemName: "Piedra Premium", qty: 1, price: 450000 }, { itemCode: "RING-001", itemName: "Anillo de Ceniza", qty: 1, price: 150000 }], total: 600000, abandonedAt: daysFromNow(-2), status: "Contactado" },
    { shopifyCartId: "gid://shopify/Cart/1003", customerName: "Invitado", email: "invitado@correo.cl", items: [{ itemCode: "CARV-001", itemName: "Figura Tallada", qty: 2, price: 180000 }], total: 360000, abandonedAt: daysFromNow(0), status: "Pendiente" },
    { shopifyCartId: "gid://shopify/Cart/1004", customerName: "Teresa Vidal", email: "teresa@correo.cl", phone: "56912340003", items: [{ itemCode: "STONE-001", itemName: "Piedra Bruta", qty: 3, price: 250000 }], total: 750000, abandonedAt: daysFromNow(-3), status: "Recuperado" },
  ];
  for (const c of abandonedDefs) {
    await prisma.abandonedCart.upsert({
      where: { shopifyCartId: c.shopifyCartId },
      update: {},
      create: { shopifyCartId: c.shopifyCartId, customerName: c.customerName, email: c.email, phone: c.phone, items: c.items, total: c.total, abandonedAt: c.abandonedAt, status: c.status, shopDomain: "kotharia.myshopify.com" },
    });
  }
  console.log(`→ Carritos abandonados: ${abandonedDefs.length}`);

  // -------------------- Audit log demo --------------------
  const adminId = userIds.get("admin@entity.local")!;
  await prisma.auditLog.createMany({
    data: [
      { actorId: adminId, action: "update", entityType: "UserModulePermission", entityId: adminId, oldValue: { canView: false }, newValue: { canView: true }, source: "Manual", createdAt: daysFromNow(-2) },
      { actorId: adminId, action: "update", entityType: "Item", entityId: items.get("AMULET-001")!, oldValue: { standardRate: 200000 }, newValue: { standardRate: 220000 }, source: "Sheets", createdAt: daysFromNow(-1) },
      { actorId: null, action: "ingest", entityType: "SalesInvoice", entityId: "FV-00001", oldValue: {}, newValue: { grandTotal: 856800 }, source: "Lorien", createdAt: new Date() },
    ],
    skipDuplicates: true,
  });
  console.log(`→ Audit logs: 3`);

  console.log("✅ Seed demo completo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });