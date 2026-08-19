import type { Route } from "./+types/finanzas";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Finanzas — Entity" }];
}

export default function Finanzas() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Finanzas
        </h1>
        <Badge color="green">activo</Badge>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Conciliación bancaria, controlling de gastos y balances
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Sincronización" description="Google Sheets → Entity">
          <p className="text-sm text-gray-600">
            6 fuentes: CC, TC, BH, SII, MePa, G66
          </p>
          <Badge color="yellow" className="mt-2">Sin probar con Sheet real</Badge>
        </Card>

        <Card title="Excepciones" description="Bandeja de glosas pendientes">
          <p className="text-sm text-gray-600">
            Falta glosa · Falta reconciliar
          </p>
        </Card>

        <Card title="Trackers" description="Catálogo de glosas">
          <p className="text-sm text-gray-600">
            Glosa Type + Glosa Vendor = Tracker
          </p>
        </Card>

        <Card title="Sugerencias" description="Motor de sugerencia de glosas">
          <p className="text-sm text-gray-600">
            Propone hasta 6 alternativas por contraparte
          </p>
        </Card>
      </div>
    </div>
  );
}
