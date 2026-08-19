import { NavLink, Outlet } from "react-router";
import { modules } from "~/modules/registry";

const modulosActivos = modules.filter(
  (m) => m.estado === "activo" || m.estado === "pendiente"
);

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-gray-100 min-h-screen flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-tight">Entity</h1>
          <p className="text-xs text-gray-400 mt-0.5">PiedraBruja</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? "bg-gray-700 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            Dashboard
          </NavLink>

          <div className="pt-3 pb-1 px-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Módulos
            </p>
          </div>

          {modulosActivos.map((mod) => (
            <NavLink
              key={mod.slug}
              to={`/${mod.prefijoRuta || mod.slug}`}
              end
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-gray-700 text-white font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {mod.nombre}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700 text-[11px] text-gray-500">
          v0.1.0
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
