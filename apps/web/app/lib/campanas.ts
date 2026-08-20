import { prisma } from "@entity/database";

export interface CampanaAnalisis {
  id: string;
  name: string;
  channel: string;
  spend: number;
  budget: number;
  ventas: number;
  facturas: number;
  unidades: number;
  roi: number; // (ventas - spend) / spend
  conversion: number; // purchases / sessions (GA4)
  avgTicket: number;
  metricas: { sesiones: number; addToCart: number; checkouts: number; compras: number; revenue: number };
}

export async function analisisCampanas() {
  const [campanas, invoices, metrics] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { spend: "desc" } }),
    prisma.salesInvoice.findMany({
      where: { campaignId: { not: null } },
      select: { campaignId: true, grandTotal: true, items: { select: { qty: true } } },
    }),
    prisma.campaignMetric.findMany(),
  ]);

  const ventasPorCampana = new Map<string, { ventas: number; facturas: number; unidades: number }>();
  for (const inv of invoices) {
    if (!inv.campaignId) continue;
    const cur = ventasPorCampana.get(inv.campaignId) ?? { ventas: 0, facturas: 0, unidades: 0 };
    cur.ventas += Number(inv.grandTotal);
    cur.facturas += 1;
    cur.unidades += inv.items.reduce((a, i) => a + Number(i.qty), 0);
    ventasPorCampana.set(inv.campaignId, cur);
  }

  const metricasPorCampana = new Map<string, CampanaAnalisis["metricas"]>();
  for (const m of metrics) {
    const cur = metricasPorCampana.get(m.campaignId) ?? { sesiones: 0, addToCart: 0, checkouts: 0, compras: 0, revenue: 0 };
    cur.sesiones += m.sessions;
    cur.addToCart += m.addToCart;
    cur.checkouts += m.checkouts;
    cur.compras += m.purchases;
    cur.revenue += Number(m.revenue);
    metricasPorCampana.set(m.campaignId, cur);
  }

  const result: CampanaAnalisis[] = campanas.map((c) => {
    const ventas = ventasPorCampana.get(c.id) ?? { ventas: 0, facturas: 0, unidades: 0 };
    const metricas = metricasPorCampana.get(c.id) ?? { sesiones: 0, addToCart: 0, checkouts: 0, compras: 0, revenue: 0 };
    const spend = Number(c.spend);
    const roi = spend > 0 ? (ventas.ventas - spend) / spend : 0;
    const conversion = metricas.sesiones > 0 ? (metricas.compras / metricas.sesiones) * 100 : 0;
    const avgTicket = ventas.facturas > 0 ? ventas.ventas / ventas.facturas : 0;

    return {
      id: c.id,
      name: c.name,
      channel: c.channel,
      spend,
      budget: Number(c.budget),
      ventas: ventas.ventas,
      facturas: ventas.facturas,
      unidades: ventas.unidades,
      roi,
      conversion,
      avgTicket,
      metricas,
    };
  });

  return result;
}

export interface Recomendacion {
  campana: string;
  canal: string;
  tipo: "escalar" | "recortar" | "funnel" | "atribucion" | "informacion";
  mensaje: string;
  severidad: "alta" | "media" | "baja";
}

export function recomendar(campanas: CampanaAnalisis[]): Recomendacion[] {
  const out: Recomendacion[] = [];

  for (const c of campanas) {
    if (c.spend <= 0) continue;

    if (c.roi >= 2) {
      out.push({
        campana: c.name,
        canal: c.channel,
        tipo: "escalar",
        mensaje: `ROI ${c.roi.toFixed(1)}x — considerá subir el presupuesto (actual: $${fmt(c.spend)}).`,
        severidad: "alta",
      });
    } else if (c.roi >= 0.5) {
      out.push({
        campana: c.name,
        canal: c.channel,
        tipo: "informacion",
        mensaje: `ROI ${c.roi.toFixed(1)}x — rentable pero ajustado. Optimizá creativos o segmentación.`,
        severidad: "media",
      });
    } else {
      out.push({
        campana: c.name,
        canal: c.channel,
        tipo: "recortar",
        mensaje: `ROI ${c.roi.toFixed(1)}x — por debajo del umbral. Recortar gasto o pausar la campaña.`,
        severidad: "alta",
      });
    }

    if (c.metricas.sesiones > 0 && c.metricas.compras > 0) {
      const conv = c.conversion;
      if (conv < 1.5) {
        out.push({
          campana: c.name,
          canal: c.channel,
          tipo: "funnel",
          mensaje: `Conversión ${conv.toFixed(1)}% (${c.metricas.compras}/${c.metricas.sesiones} sesiones) — el funnel pierde mucho. Revisá landing y checkout.`,
          severidad: "media",
        });
      }
      const cartDrop = c.metricas.addToCart > 0 ? (1 - c.metricas.checkouts / c.metricas.addToCart) * 100 : 0;
      if (cartDrop > 50) {
        out.push({
          campana: c.name,
          canal: c.channel,
          tipo: "funnel",
          mensaje: `Abandono de carrito ${cartDrop.toFixed(0)}% — probar envíos gratis o descuentos.`,
          severidad: "baja",
        });
      }
    }

    const ventas = c.ventas;
    if (ventas > 0 && c.metricas.revenue > 0 && ventas < c.metricas.revenue * 0.6) {
      out.push({
        campana: c.name,
        canal: c.channel,
        tipo: "atribucion",
        mensaje: `GA4 reporta $${fmt(c.metricas.revenue)} pero el Hub solo atribuye $${fmt(ventas)} — probable brecha de UTM en las URLs.`,
        severidad: "baja",
      });
    }
  }

  const conVentas = campanas.filter((c) => c.ventas > 0);
  if (conVentas.length > 1) {
    const top = [...conVentas].sort((a, b) => b.roi - a.roi)[0];
    const peor = [...conVentas].sort((a, b) => a.roi - b.roi)[0];
    if (top.roi > peor.roi * 2) {
      out.push({
        campana: top.name,
        canal: top.channel,
        tipo: "escalar",
        mensaje: `«${top.name}» (ROI ${top.roi.toFixed(1)}x) rinde más del doble que «${peor.name}» — reasignar presupuesto entre ambas.`,
        severidad: "alta",
      });
    }
  }

  const sinVentas = campanas.filter((c) => c.spend > 0 && c.ventas === 0);
  if (sinVentas.length > 0) {
    out.push({
      campana: sinVentas.map((c) => c.name).join(", "),
      canal: "—",
      tipo: "atribucion",
      mensaje: "Campañas con gasto pero sin ventas atribuidas: verificar que las URLs usen utm_campaign correcto.",
      severidad: "media",
    });
  }

  const order: Record<Recomendacion["severidad"], number> = { alta: 0, media: 1, baja: 2 };
  return out.sort((a, b) => order[a.severidad] - order[b.severidad]);
}

export function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);
}