import type { Route } from "./+types/dashboard";
import { modules } from "~/modules/registry";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Entity — PiedraBruja" }];
}

const estadoColors = {
  activo: "green" as const,
  pendiente: "yellow" as const,
  diseño: "gray" as const,
};

export default function Dashboard() {
  const modulosVisibles = modules.filter((m) => m.slug !== "main");

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Entity
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Plataforma de controlling y conciliación — PiedraBruja
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulosVisibles.map((mod) => (
          <Card key={mod.slug} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {mod.nombre}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Rama: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{mod.rama}</code>
                  {" · "}
                  Dueño: {mod.dueño}
                </p>
              </div>
              <Badge color={estadoColors[mod.estado]}>{mod.estado}</Badge>
            </div>
            {mod.credenciales.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Credenciales: {mod.credenciales.join(", ")}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
