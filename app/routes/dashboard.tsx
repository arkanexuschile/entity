import type { Route } from "./+types/dashboard";
import { useLoaderData } from "react-router";
import { modules } from "~/modules/registry";
import { getUser } from "~/lib/auth.server";
import { db } from "~/db/client.server";
import { users, jobs } from "~/db/schema";
import { count, eq } from "drizzle-orm";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Entity — Panel" }];
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

export default function Dashboard() {
  const { user, stats, integrations } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
            Panel
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vista general del sistema
          </p>
        </div>
        {user && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Sesión activa</p>
            <p className="text-sm font-semibold text-amber-400">{user.nombre}</p>
            <p className="text-[10px] text-gray-500">{user.role}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Módulos" value={stats.modulosActivos + stats.modulosPendientes} sub={`${stats.modulosActivos} activos`} color="amber" />
        <StatCard label="Usuarios" value={stats.totalUsers} sub="registrados" color="blue" />
        <StatCard label="Jobs" value={stats.totalJobs} sub="programados" color="purple" />
        <StatCard label="Errores" value={stats.jobsConError} sub="en jobs" color={stats.jobsConError > 0 ? "red" : "green"} />
      </div>

      {/* Módulos — solo activos y pendientes */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Módulos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules
            .filter((m) => m.slug !== "main" && (m.estado === "activo" || m.estado === "pendiente"))
            .map((mod) => (
              <div
                key={mod.slug}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-amber-600/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-100">{mod.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      <code className="bg-gray-800 px-1 rounded text-gray-400">{mod.rama}</code>
                      {" · "}
                      {mod.dueño}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      mod.estado === "activo"
                        ? "bg-green-900/50 text-green-400 border border-green-700/50"
                        : "bg-yellow-900/50 text-yellow-400 border border-yellow-700/50"
                    }`}
                  >
                    {mod.estado === "activo" ? "Activo" : "Pendiente"}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Estado del sistema */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Sistema
        </h2>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Base de datos</p>
              <p className="text-xs text-green-400 font-medium mt-1">SQLite OK</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Auth</p>
              <p className="text-xs text-green-400 font-medium mt-1">Activo</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Shopify</p>
              <p className={`text-xs font-medium mt-1 ${integrations.shopify ? "text-green-400" : "text-gray-500"}`}>
                {integrations.shopify ? "Configurado" : "Sin configurar"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Google Sheets</p>
              <p className={`text-xs font-medium mt-1 ${integrations.googleSheets ? "text-green-400" : "text-gray-500"}`}>
                {integrations.googleSheets ? "Configurado" : "Sin configurar"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: "amber" | "blue" | "purple" | "green" | "red";
}) {
  const colors = {
    amber: "text-amber-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    red: "text-red-400",
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}
