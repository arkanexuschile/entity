import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, useActionData, useLoaderData, useSearchParams } from "react-router";
import { prisma } from "@entity/database";
import { requireUser } from "../lib/auth.server";
import { FlameIcon, GemIcon, ScalesIcon, ScrollIcon, ShieldIcon, SwordIcon } from "../components/icons";
import { resumenFinanzas } from "../lib/finanzas";
import { analisisCampanas, recomendar, fmt } from "../lib/campanas";
import { isShopifyConfigured, syncShopifyTodo } from "../lib/shopify.server";

export const meta: MetaFunction = () => [
  { title: "Salón del Gremio · Entity" },
  { name: "description", content: "Hub operativo de Entity — ERP en Remix/Node" },
];

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "sync-shopify") {
    if (!isShopifyConfigured()) {
      return { shopify: { ok: false as const, error: "Shopify no configurado — falta SHOPIFY_SHOP_DOMAIN o SHOPIFY_ADMIN_TOKEN en .env" } };
    }
    try {
      const resultados = await syncShopifyTodo();
      return { shopify: { ok: true as const, ...resultados } };
    } catch (e) {
      return { shopify: { ok: false as const, error: e instanceof Error ? e.message : String(e) } };
    }
  }

  return { shopify: null };
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.trim() ?? "";
  const to = url.searchParams.get("to")?.trim() ?? "";
  const fromDate = from ? new Date(from + "T00:00:00") : undefined;
  const toDate = to ? new Date(to + "T23:59:59") : undefined;
  const [company, accounts, items, tasks, warehouses, resumen, campanas, logs] = await Promise.all([
    prisma.company.findFirst({ include: { defaultWarehouse: true } }),
    prisma.account.count(),
    prisma.item.count(),
    prisma.task.findMany({ orderBy: { orderIndex: "asc" }, include: { assignee: true } }),
    prisma.warehouse.count(),
    resumenFinanzas({ from: fromDate, to: toDate }),
    analisisCampanas(),
    prisma.ingestLog.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
  ]);

  const recomendaciones = recomendar(campanas).slice(0, 3);

  // Semáforo por fuente: último log por source
  const sources = ["Lorien", "Defontana", "Shopify", "GA4", "Sheets", "Seed"] as const;
  const bySource: Record<string, (typeof logs)[number] | undefined> = {};
  for (const s of sources) {
    const found = logs.find((l) => l.source.toLowerCase() === s.toLowerCase());
    bySource[s] = found;
  }

  const resendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  const resendLog = resendConfigured
    ? { source: "Resend", status: "Done", startedAt: new Date(), docsCount: 0, message: `Remitente ${process.env.RESEND_FROM}` } as unknown as (typeof logs)[number]
    : undefined;

  return { company, accounts, items, tasks, warehouses, resumen, recomendaciones, health: { logs, bySource, resendConfigured, resendLog }, shopifyConfigured: isShopifyConfigured(), filters: { from, to } };
}

const statusLabel: Record<string, string> = {
  TODO: "Pendiente",
  IN_PROGRESS: "En curso",
  DONE: "Completada",
  BLOCKED: "Bloqueada",
};

const statusClass: Record<string, string> = {
  TODO: "",
  IN_PROGRESS: "gold",
  DONE: "green",
  BLOCKED: "red",
};

const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const miniLab: React.CSSProperties = { display: "block", fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint)", marginBottom: "0.2rem" };
const miniInp: React.CSSProperties = { width: "100%", background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: 6, padding: "0.35rem 0.45rem", fontSize: "0.8rem", fontFamily: "inherit" };
const miniBtn: React.CSSProperties = { background: "none", border: "1px solid var(--line)", color: "var(--gold-soft)", borderRadius: 6, padding: "0.35rem 0.6rem", fontSize: "0.7rem", cursor: "pointer", alignSelf: "end" };

export default function Home() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [params, setParams] = useSearchParams();
  const shopifyResult = actionData?.shopify;

  const tiles = [
    { icon: ScalesIcon, value: money.format(data.resumen.ingresos), label: "Ingresos" },
    { icon: ShieldIcon, value: money.format(data.resumen.margenBruto), label: "Margen bruto" },
    { icon: GemIcon, value: data.items, label: "Ítems del catálogo" },
    { icon: FlameIcon, value: `${data.recomendaciones.length}`, label: "Recomendaciones" },
  ];

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };
  const preset = (days: number | null) => {
    const next = new URLSearchParams(params);
    if (days === null) {
      next.delete("from");
      next.delete("to");
    } else {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - days);
      next.set("from", from.toISOString().slice(0, 10));
      next.set("to", to.toISOString().slice(0, 10));
    }
    setParams(next);
  };
  const presetLabel = data.filters.from || data.filters.to ? `Filtrado ${data.filters.from || "…"} → ${data.filters.to || "…"} · ${data.resumen.facturas} facturas` : `${data.resumen.facturas} facturas (todo el período)`;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldIcon />
            Salón del Gremio
          </h1>
          <p className="page-sub">
            Bienvenido, {data.company?.name ?? "PiedraBruja"} — el reino prospera bajo tu signo.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
          <Form method="post">
            <input type="hidden" name="intent" value="sync-shopify" />
            <button
              type="submit"
              disabled={!data.shopifyConfigured}
              title={data.shopifyConfigured ? "Sincronizar productos, pedidos y carritos desde Shopify" : "Configura SHOPIFY_SHOP_DOMAIN y SHOPIFY_ADMIN_TOKEN en .env"}
              style={{
                ...miniBtn,
                background: data.shopifyConfigured ? "var(--orange)" : "rgba(234,88,12,0.25)",
                color: data.shopifyConfigured ? "#fff" : "var(--faint)",
                border: "none",
                alignSelf: "flex-end",
              }}
            >
              Sincronizar Shopify
            </button>
          </Form>
          {shopifyResult && shopifyResult.ok && (
            <div style={{ fontSize: "0.72rem", color: "var(--gold-soft)", maxWidth: 340, textAlign: "right" }}>
              Productos: {shopifyResult.productos?.message} · Pedidos: {shopifyResult.pedidos?.message} · Carritos: {shopifyResult.carritos?.message}
            </div>
          )}
          {shopifyResult && !shopifyResult.ok && (
            <div style={{ fontSize: "0.72rem", color: "var(--danger)", maxWidth: 340, textAlign: "right" }}>{shopifyResult.error}</div>
          )}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "0.85fr 0.85fr auto auto auto auto auto auto", gap: "0.5rem", alignItems: "end", marginBottom: "0.6rem" }}>
        <div>
          <label style={miniLab}>Desde</label>
          <input type="date" value={data.filters.from} onChange={(e) => update("from", e.target.value)} style={miniInp} />
        </div>
        <div>
          <label style={miniLab}>Hasta</label>
          <input type="date" value={data.filters.to} onChange={(e) => update("to", e.target.value)} style={miniInp} />
        </div>
        <button onClick={() => preset(30)} style={miniBtn}>Mensual</button>
        <button onClick={() => preset(90)} style={miniBtn}>Trimestral</button>
        <button onClick={() => preset(180)} style={miniBtn}>Semestral</button>
        <button onClick={() => preset(365)} style={miniBtn}>Anual</button>
        <button onClick={() => preset(null)} style={miniBtn}>Todo</button>
        <button onClick={() => setParams(new URLSearchParams())} style={miniBtn}>Limpiar</button>
      </div>
      <div style={{ fontSize: "0.72rem", color: "var(--faint)", marginBottom: "0.6rem", textAlign: "right" }}>{presetLabel}</div>

      <div className="tiles">
        {tiles.map(({ icon: Icon, value, label }) => (
          <div className="tile" key={label}>
            <Icon className="tile-icon" />
            <div className="tile-value">{value}</div>
            <div className="tile-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="rune-divider">✦</div>

      <section className="panel">
        <h2 className="panel-title">Salud de la ingesta — semáforo de datos</h2>
        <p style={{ fontSize: "0.78rem", color: "var(--faint)", marginTop: "-0.4rem", marginBottom: "0.7rem" }}>
          Si una fuente está en rojo, el margen de Finanzas puede ser mentira. Click en una factura en Ventas muestra lineage: Shopify Order → DTE → Asiento.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem" }}>
          {(["Lorien", "Defontana", "Shopify", "GA4", "Sheets", "Seed"] as const).map((s) => {
            const log = data.health.bySource[s];
            const status = log?.status ?? "Sin datos";
            const cls = status === "Done" ? "green" : status === "Running" ? "gold" : status === "Failed" ? "red" : "";
            const when = log ? new Date(log.startedAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) : "—";
            return (
              <div key={s} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "0.6rem 0.7rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "var(--ink)", fontSize: "0.85rem" }}>{s}</strong>
                  <span className={`badge ${cls}`} style={{ fontSize: "0.65rem" }}>{status}</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--faint)", marginTop: "0.25rem" }}>{when} · {log ? `${log.docsCount} docs` : "—"}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log?.message ?? "Sin sincronización"}</div>
              </div>
            );
          })}
          <div style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "0.6rem 0.7rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ color: "var(--ink)", fontSize: "0.85rem" }}>Resend</strong>
              <span className={`badge ${data.health.resendConfigured ? "green" : "gold"}`} style={{ fontSize: "0.65rem" }}>{data.health.resendConfigured ? "Configurado" : "Pendiente"}</span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--faint)", marginTop: "0.25rem" }}>{data.health.resendConfigured ? "Notificaciones activas" : "Sin API key"}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(data.health.resendLog as { message?: string } | undefined)?.message ?? "RESEND_API_KEY no configurado — correos en modo skipped"}</div>
          </div>
        </div>
        {data.health.logs.length > 0 && (
          <div style={{ marginTop: "0.7rem", fontSize: "0.72rem", color: "var(--faint)" }}>
            Últimos {data.health.logs.length} eventos · Fuente más antigua: {new Date(data.health.logs[data.health.logs.length - 1].startedAt).toLocaleDateString("es-CL")}
          </div>
        )}
      </section>

      <div className="rune-divider">✦</div>

      <section className="panel panel-scroll">
        <h2 className="panel-title">El oráculo recomienda</h2>
        {data.recomendaciones.length === 0 ? (
          <p style={{ color: "var(--parchment-ink)", fontStyle: "italic" }}>
            Aún sin recomendaciones — sincronizá más datos de campañas.
          </p>
        ) : (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {data.recomendaciones.map((r, i) => (
              <li key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                <span className={`badge ${r.severidad === "alta" ? "red" : r.severidad === "media" ? "gold" : "green"}`}>
                  {r.tipo}
                </span>
                <span style={{ color: "var(--parchment-ink)" }}>{r.mensaje}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rune-divider">✦</div>

      <section className="panel">
        <h2 className="panel-title">Tablón de misiones</h2>
        {data.tasks.length === 0 ? (
          <p style={{ color: "var(--muted)", fontStyle: "italic" }}>El tablón aguarda sus primeras misiones.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Misión</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Encargado</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>
                      <span className="badge gold">{task.priority}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusClass[task.status] ?? ""}`}>
                        {statusLabel[task.status] ?? task.status}
                      </span>
                    </td>
                    <td>{task.assignee?.name ?? "Sin asignar"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}