import type { Route } from "./+types/dashboard";
import { useLoaderData } from "react-router";
import { modules } from "~/modules/registry";
import { getUser } from "~/lib/auth.server";
import { Badge } from "~/components/ui/Badge";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Entity — PiedraBruja" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  return { user };
}

const estadoColors = {
  activo: "green" as const,
  pendiente: "yellow" as const,
  diseño: "gray" as const,
};

const estadoLabels = {
  activo: "Activo",
  pendiente: "Pendiente",
  diseño: "En diseño",
};

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();
  const modulosVisibles = modules.filter((m) => m.slug !== "main");

  return (
    <div>
      {/* Header RPG */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight flex items-center gap-3">
            <span className="text-amber-400">&#9876;</span>
            Entity
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Plataforma de controlling y conciliación — PiedraBruja
          </p>
        </div>
        {user && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Bienvenido</p>
            <p className="text-sm font-semibold text-amber-400">{user.nombre}</p>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Módulos</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {modulosVisibles.length}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Activos</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {modulosVisibles.filter((m) => m.estado === "activo").length}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {modulosVisibles.filter((m) => m.estado === "pendiente").length}
          </p>
        </div>
      </div>

      {/* Módulos */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          &#9654; Módulos Disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulosVisibles.map((mod) => (
            <div
              key={mod.slug}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-amber-600/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">
                    {mod.nombre}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    <code className="bg-gray-800 px-1 rounded text-gray-400">{mod.rama}</code>
                    {" · "}
                    {mod.dueño}
                  </p>
                </div>
                <Badge color={estadoColors[mod.estado]}>
                  {estadoLabels[mod.estado]}
                </Badge>
              </div>
              {mod.credenciales.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500">
                    &#128274; {mod.credenciales.join(", ")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
