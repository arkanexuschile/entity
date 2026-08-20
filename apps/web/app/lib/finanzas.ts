import { prisma } from "@entity/database";

export interface FinanzasResumen {
  ingresos: number;
  costos: number;
  iva: number;
  margenBruto: number;
  margenPct: number;
  facturas: number;
  compras: number;
}

export async function resumenFinanzas(opts?: { from?: Date; to?: Date }) {
  const dateFilter = opts?.from || opts?.to ? { gte: opts?.from, lte: opts?.to } : undefined;
  const salesWhere: Record<string, unknown> = {};
  const glWhere: Record<string, unknown> = { voucherType: "SalesInvoice", account: { name: "Costo de Venta" } };
  if (dateFilter) {
    (salesWhere as Record<string, unknown>).postingDate = dateFilter;
    (glWhere as Record<string, unknown>).postingDate = dateFilter;
  }
  const [sales, purchases, cogs] = await Promise.all([
    prisma.salesInvoice.aggregate({
      where: salesWhere as never,
      _sum: { netTotal: true, totalTax: true, grandTotal: true },
      _count: true,
    }),
    prisma.purchaseInvoice.aggregate({ _sum: { grandTotal: true }, _count: true }),
    prisma.glEntry.aggregate({
      _sum: { debit: true },
      where: glWhere as never,
    }),
  ]);

  const ingresos = Number(sales._sum.netTotal ?? 0);
  const iva = Number(sales._sum.totalTax ?? 0);
  const costos = Number(cogs._sum.debit ?? 0);
  const margenBruto = ingresos - costos;

  const resumen: FinanzasResumen = {
    ingresos,
    costos,
    iva,
    margenBruto,
    margenPct: ingresos > 0 ? (margenBruto / ingresos) * 100 : 0,
    facturas: sales._count,
    compras: Number(purchases._count ?? 0),
  };
  return resumen;
}

export interface SerieMensual {
  mes: string;
  ingresos: number;
  costos: number;
  margen: number;
}

export async function seriePorMes(opts?: { from?: Date; to?: Date; groupBy?: "month" | "quarter" }) {
  const dateFilter = opts?.from || opts?.to ? { gte: opts?.from, lte: opts?.to } : undefined;
  const invoices = await prisma.salesInvoice.findMany({
    where: dateFilter ? ({ postingDate: dateFilter } as never) : undefined,
    select: { postingDate: true, netTotal: true },
  });
  const cogsEntries = await prisma.glEntry.findMany({
    where: { voucherType: "SalesInvoice", account: { name: "Costo de Venta" }, ...(dateFilter ? { postingDate: dateFilter } : {}) } as never,
    select: { postingDate: true, debit: true },
  });

  const groupBy = opts?.groupBy ?? "month";
  const keyFn = groupBy === "quarter" ? keyTrimestre : keyMes;
  const map = new Map<string, { ingresos: number; costos: number }>();
  for (const i of invoices) {
    const key = keyFn(i.postingDate);
    const cur = map.get(key) ?? { ingresos: 0, costos: 0 };
    cur.ingresos += Number(i.netTotal);
    map.set(key, cur);
  }
  for (const e of cogsEntries) {
    const key = keyFn(e.postingDate);
    const cur = map.get(key) ?? { ingresos: 0, costos: 0 };
    cur.costos += Number(e.debit);
    map.set(key, cur);
  }

  const serie: SerieMensual[] = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({
      mes,
      ingresos: v.ingresos,
      costos: v.costos,
      margen: v.ingresos - v.costos,
    }));
  return serie;
}

function keyMes(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function keyTrimestre(d: Date) {
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${y}-Q${q}`;
}

export interface ProductoRentable {
  itemName: string;
  itemCode: string;
  unidades: number;
  ingresos: number;
  costo: number;
  margen: number;
  margenPct: number;
}

export async function rentabilidadPorProducto(opts?: { from?: Date; to?: Date }) {
  const dateFilter = opts?.from || opts?.to ? { gte: opts?.from, lte: opts?.to } : undefined;
  const items = await prisma.item.findMany({
    select: { id: true, itemName: true, itemCode: true },
  });
  const lines = await prisma.salesInvoiceItem.findMany({
    where: dateFilter ? ({ invoice: { postingDate: dateFilter } } as never) : undefined,
    select: { itemId: true, qty: true, rate: true },
  });
  const ledgerOut = await prisma.stockLedgerEntry.findMany({
    where: { voucherType: "SalesInvoice", actualQty: { lt: 0 }, ...(dateFilter ? { postingDate: dateFilter } : {}) } as never,
    select: { itemId: true, stockValue: true },
  });

  const costByItem = new Map<string, number>();
  for (const e of ledgerOut) {
    costByItem.set(e.itemId, (costByItem.get(e.itemId) ?? 0) + Number(e.stockValue));
  }

  const byItem = new Map<string, { unidades: number; ingresos: number }>();
  for (const l of lines) {
    const cur = byItem.get(l.itemId) ?? { unidades: 0, ingresos: 0 };
    cur.unidades += Number(l.qty);
    cur.ingresos += Number(l.qty) * Number(l.rate);
    byItem.set(l.itemId, cur);
  }

  const result: ProductoRentable[] = items
    .map((item) => {
      const v = byItem.get(item.id) ?? { unidades: 0, ingresos: 0 };
      const costo = Math.abs(costByItem.get(item.id) ?? 0);
      const margen = v.ingresos - costo;
      return {
        itemName: item.itemName,
        itemCode: item.itemCode,
        unidades: v.unidades,
        ingresos: v.ingresos,
        costo,
        margen,
        margenPct: v.ingresos > 0 ? (margen / v.ingresos) * 100 : 0,
      };
    })
    .filter((p) => p.unidades > 0)
    .sort((a, b) => b.margen - a.margen);

  return result;
}