import type { Route } from "./+types/finanzas";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Finanzas — Entity" }];
}

export default function Finanzas() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-amber-400 text-xl">&#9876;</span>
        <h1 className="text-xl font-bold text-gray-100">Finanzas</h1>
        <Badge color="green">Activo</Badge>
      </div>
      <p className="text-sm text-gray-500 mt-1 ml-9">
        Conciliación bancaria, controlling de gastos y balances
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Sincronización" description="Google Sheets → Entity">
          <p className="text-sm text-gray-400">
            6 fuentes: CC, TC, BH, SII, MePa, G66
          </p>
          <Badge color="yellow" className="mt-2">Sin probar con Sheet real</Badge>
        </Card>

        <Card title="Excepciones" description="Bandeja de glosas pendientes">
          <p className="text-sm text-gray-400">
            Falta glosa · Falta reconciliar
          </p>
        </Card>

        <Card title="Trackers" description="Catálogo de glosas">
          <p className="text-sm text-gray-400">
            Glosa Type + Glosa Vendor = Tracker
          </p>
        </Card>

        <Card title="Sugerencias" description="Motor de sugerencia de glosas">
          <p className="text-sm text-gray-400">
            Propone hasta 6 alternativas por contraparte
          </p>
        </Card>
      </div>
    </div>
  );
}
