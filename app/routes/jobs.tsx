import type { Route } from "./+types/jobs";
import { db } from "~/db/client.server";
import { jobs } from "~/db/schema";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Jobs — Entity" }];
}

export async function loader({}: Route.LoaderArgs) {
  const allJobs = db.select().from(jobs).all();
  return { jobs: allJobs };
}

const estadoColors = {
  ok: "green" as const,
  error: "red" as const,
  pendiente: "yellow" as const,
};

const estadoLabels = {
  ok: "OK",
  error: "Error",
  pendiente: "Pendiente",
};

export default function Jobs({ loaderData }: Route.ComponentProps) {
  const { jobs: allJobs } = loaderData;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-amber-400 text-xl">&#9876;</span>
        <h1 className="text-xl font-bold text-gray-100">Jobs Programados</h1>
      </div>
      <p className="text-sm text-gray-500 mt-1 ml-9">
        Scheduler de tareas automáticas — ejecutados vía systemd timer
      </p>

      {allJobs.length === 0 ? (
        <div className="mt-6">
          <Card>
            <p className="text-sm text-gray-400 text-center py-4">
              No hay jobs programados todavía.
            </p>
            <p className="text-xs text-gray-500 text-center">
              Los módulos registran sus jobs en la tabla{" "}
              <code className="bg-gray-800 px-1 rounded">jobs</code> cuando los necesitan.
            </p>
          </Card>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {allJobs.map((job) => (
            <div
              key={job.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">
                    {job.nombre}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tipo: <code className="bg-gray-800 px-1 rounded">{job.tipo}</code>
                    {job.frecuencia && (
                      <>
                        {" · "}
                        Frecuencia: <code className="bg-gray-800 px-1 rounded">{job.frecuencia}</code>
                      </>
                    )}
                  </p>
                </div>
                <Badge color={estadoColors[job.ultimoEstado ?? "pendiente"]}>
                  {estadoLabels[job.ultimoEstado ?? "pendiente"]}
                </Badge>
              </div>

              {job.ultimaEjecucion && (
                <p className="text-[11px] text-gray-500 mt-2">
                  Última ejecución: {new Date(job.ultimaEjecucion).toLocaleString("es-CL")}
                </p>
              )}

              {job.log && (
                <pre className="mt-2 text-[11px] text-gray-400 bg-gray-800 rounded p-2 overflow-x-auto max-h-20">
                  {job.log}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
