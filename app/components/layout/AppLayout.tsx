import { NavLink, Outlet, useLoaderData, redirect } from "react-router";
import { modules } from "~/modules/registry";
import { getUser, getUserId } from "~/lib/auth.server";
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
import type { Route } from "./+types/AppLayout";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (!userId) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  const user = await getUser(request);
  return { user };
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  miembro: "Miembro",
};

const moduleIcons: Record<string, (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  main: ShieldIcon,
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

const modulosVisibles = modules.filter(
  (m) => m.slug !== "main" && (m.estado === "activo" || m.estado === "pendiente")
);

export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="crest">
          <div className="crest-shield">E</div>
          <div>
            <div className="crest-title">Entity</div>
            <div className="crest-sub">PiedraBruja</div>
          </div>
        </div>

        <div className="sidebar-label">Módulos</div>
        <ul className="nav">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <ShieldIcon />
              <span>Salón del Gremio</span>
            </NavLink>
          </li>

          {modulosVisibles.map((mod) => {
            const Icon = moduleIcons[mod.slug] ?? GemIcon;
            return (
              <li key={mod.slug}>
                <div className="nav-link nav-link-locked" title="Próximamente">
                  <Icon />
                  <span>{mod.nombre}</span>
                  {mod.estado === "pendiente" && (
                    <span className="badge" style={{ marginLeft: "auto", fontSize: "0.6rem" }}>
                      Pronto
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-foot">
          {user && (
            <>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--ink)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.nombre}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--faint)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span className="badge" style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem" }}>
                  {roleLabels[user.role] ?? user.role}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</span>
              </div>
              <form method="post" action="/logout" style={{ marginTop: "0.6rem" }}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    background: "rgba(232,199,118,0.12)",
                    border: "1px solid rgba(232,199,118,0.25)",
                    color: "var(--gold-soft)",
                    borderRadius: 6,
                    padding: "0.4rem",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "var(--display)",
                  }}
                >
                  Salir
                </button>
              </form>
              <div className="realm-status" style={{ marginTop: "0.6rem" }}>
                <span className="dot" />
                <span>PiedraBruja · CLP</span>
              </div>
            </>
          )}
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}