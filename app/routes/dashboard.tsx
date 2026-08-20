import type { Route } from "./+types/dashboard";
import { useLoaderData } from "react-router";
import { modules } from "~/modules/registry";
import { getUser } from "~/lib/auth.server";
import { db } from "~/db/client.server";
import { users, jobs } from "~/db/schema";
import { count, eq } from "drizzle-orm";
import {
  ShieldIcon,
  SwordIcon,
  BagIcon,
  ScalesIcon,
  GemIcon,
  FlameIcon,
  ScrollIcon,
  CompassIcon,
  AnvilIcon,
} from "~/components/icons";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Salón del Gremio · Entity" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  const totalUsers = db.select({ value: count() }).from(users).get()?.value ?? 0;
  const totalJobs = db.select({ value: count() }).from(jobs).get()?.value ?? 0;
  const jobsConError = db
    .select({ value: count() })
    .from(jobs)
    .where(eq(jobs.ultimoEstado, "error"))
    .get()?.value ?? 0;

  const modulosActivos = modules.filter((m) => m.estado === "activo").length;
  const modulosPendientes = modules.filter((m) => m.estado === "pendiente").length;

  return {
    user,
    stats: {
      totalUsers,
      totalJobs,
      jobsConError,
      modulosActivos,
      modulosPendientes,
    },
    integrations: {
      shopify: !!process.env.SHOPIFY_SHOP_DOMAIN,
      googleSheets: !!process.env.GOOGLE_SHEET_ID,
    },
  };
}

const moduleIcons: Record<string, (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  finanzas: ScalesIcon,
  abc: GemIcon,
  compras: BagIcon,
  venta: SwordIcon,
  estrategias: CompassIcon,
  marketing: FlameIcon,
  gestion: ScrollIcon,
  licitaciones: AnvilIcon,
  distribuidora: BagIcon,
};

export default function Dashboard() {
  const { user, stats, integrations } = useLoaderData<typeof loader>();
  const modulos = modules.filter((m) => m.slug !== "main");

  const tiles = [
    { icon: ShieldIcon, value: stats.modulosActivos + stats.modulosPendientes, label: "Módulos" },
    { icon: SwordIcon, value: stats.totalUsers, label: "Usuarios" },
    { icon: ScrollIcon, value: stats.totalJobs, label: "Jobs" },
    { icon: FlameIcon, value: stats.jobsConError, label: "Errores" },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldIcon />
            Salón del Gremio
          </h1>
          <p className="page-sub">
            {user
              ? `Bienvenido, ${user.nombre} — el reino prospera bajo tu signo.`
              : "Bienvenido al reino de PiedraBruja."}
          </p>
        </div>
      </header>

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
        <h2 className="panel-title">Salud del sistema — semáforo</h2>
        <p style={{ fontSize: "0.78rem", color: "var(--faint)", marginTop: "-0.4rem", marginBottom: "0.7rem" }}>
          Estado de las integraciones y servicios del reino.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem" }}>
          {[
            { s: "Base de datos", ok: true, sub: "SQLite en línea" },
            { s: "Auth", ok: true, sub: `${stats.totalUsers} usuarios` },
            { s: "Shopify", ok: integrations.shopify, sub: integrations.shopify ? "Admin API configurada" : "Sin configurar" },
            { s: "Google Sheets", ok: integrations.googleSheets, sub: integrations.googleSheets ? "Service account OK" : "Sin configurar" },
          ].map(({ s, ok, sub }) => (
            <div key={s} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "0.6rem 0.7rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--ink)", fontSize: "0.85rem" }}>{s}</strong>
                <span className={`badge ${ok ? "green" : "gold"}`} style={{ fontSize: "0.65rem" }}>
                  {ok ? "Activo" : "Pendiente"}
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--faint)", marginTop: "0.25rem" }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="rune-divider">✦</div>

      <section className="panel">
        <h2 className="panel-title">Módulos del reino</h2>
        <p style={{ fontSize: "0.78rem", color: "var(--faint)", marginTop: "-0.4rem", marginBottom: "0.7rem" }}>
          Estos módulos se irán desbloqueando conforme se construyan.
        </p>
        <div className="module-grid">
          {modulos.map((mod) => {
            const Icon = moduleIcons[mod.slug] ?? GemIcon;
            return (
              <div className="module-card" key={mod.slug} style={{ cursor: "not-allowed", opacity: mod.estado === "activo" ? 1 : 0.65 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Icon style={{ width: 20, height: 20, color: "var(--orange-soft)", flexShrink: 0 }} />
                  <h3 style={{ margin: 0 }}>{mod.nombre}</h3>
                </div>
                <p style={{ marginTop: "0.5rem" }}>
                  <span className={`badge ${mod.estado === "activo" ? "green" : "gold"}`} style={{ fontSize: "0.6rem" }}>
                    {mod.estado === "activo" ? "Activo" : "En diseño"}
                  </span>
                </p>
                <p style={{ marginTop: "0.4rem" }}>
                  {mod.dueño !== "Por definir" ? mod.dueño : "Por definir"} · {mod.rama}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}