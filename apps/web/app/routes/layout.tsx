import { NavLink, Outlet, useLoaderData, Form, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { BagIcon, CompassIcon, FlameIcon, GemIcon, ScalesIcon, ScrollIcon, ShieldIcon, SwordIcon } from "../components/icons";
import { getUser } from "../lib/auth.server";

const modulesRaw = [
  { to: "/ventas", label: "Ventas", icon: SwordIcon },
  { to: "/compras", label: "Compras", icon: BagIcon },
  { to: "/inventario", label: "Inventario", icon: GemIcon },
  { to: "/finanzas", label: "Finanzas", icon: ScalesIcon },
  { to: "/campanas", label: "Campañas", icon: FlameIcon },
  { to: "/tareas", label: "Tareas", icon: ScrollIcon },
  { to: "/contabilidad", label: "Contabilidad", icon: GemIcon },
  { to: "/reportes", label: "Reportes", icon: CompassIcon },
  { to: "/carritos", label: "Carritos", icon: BagIcon },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export default function Layout() {
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
            <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <ShieldIcon />
              <span>Salón del Gremio</span>
            </NavLink>
          </li>

          {modulesRaw.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <div className="nav-link nav-link-locked" title="Próximamente">
                <Icon />
                <span>{label}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="sidebar-foot">
          <div style={{ fontSize: "0.8rem", color: "var(--ink)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.name}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--faint)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span className="badge" style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem" }}>{user.role}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
          </div>
          <Form method="post" action="/logout" style={{ marginTop: "0.6rem" }}>
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
          </Form>
          <div className="realm-status" style={{ marginTop: "0.6rem" }}>
            <span className="dot" />
            <span>PiedraBruja · CLP</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}