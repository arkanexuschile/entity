import { NavLink, Outlet, useLoaderData } from "react-router";
import { modules } from "~/modules/registry";
import { getUser } from "~/lib/auth.server";
import type { Route } from "./+types/AppLayout";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  return { user };
}

const modulosActivos = modules.filter(
  (m) => m.estado === "activo" || m.estado === "pendiente"
);

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  miembro: "Miembro",
};

export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 border-r border-gray-700 min-h-screen flex flex-col shrink-0">
        {/* Header RPG */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">&#9876;</span>
            <div>
              <h1 className="text-base font-bold text-gray-100 tracking-tight">
                Entity
              </h1>
              <p className="text-[10px] text-gray-500">PiedraBruja</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? "bg-amber-600/20 text-amber-400 border border-amber-600/30 font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-xs">&#9733;</span>
            Dashboard
          </NavLink>

          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Módulos
            </p>
          </div>

          {modulosActivos.map((mod) => (
            <NavLink
              key={mod.slug}
              to={`/${mod.prefijoRuta || mod.slug}`}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-amber-600/20 text-amber-400 border border-amber-600/30 font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="text-xs opacity-60">&#9654;</span>
              {mod.nombre}
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-3 border-t border-gray-700">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">
                  {user.nombre}
                </p>
                <p className="text-[10px] text-gray-500">
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
              <form method="post" action="/logout">
                <button
                  type="submit"
                  className="text-[10px] text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
                  title="Salir"
                >
                  &#10005;
                </button>
              </form>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="text-xs">&#9654;</span>
              Entrar
            </NavLink>
          )}
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            v0.1.0
          </p>
        </div>
      </aside>

      <main className="flex-1 bg-gray-950 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
