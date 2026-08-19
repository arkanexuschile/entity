import type { Route } from "./+types/abc";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";

export function meta({}: Route.MetaArgs) {
  return [{ title: "ABC — Entity" }];
}

export default function ABC() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-amber-400 text-xl">&#9876;</span>
        <h1 className="text-xl font-bold text-gray-100">ABC</h1>
        <Badge color="yellow">Pendiente</Badge>
      </div>
      <p className="text-sm text-gray-500 mt-1 ml-9">
        Clasificación de SKU — lógica de KAM, reposición y liquidación
      </p>

      <div className="mt-6">
        <Card title="Próximamente">
          <p className="text-sm text-gray-400">
            Este módulo será construido por Germán en la rama{" "}
            <code className="bg-gray-800 px-1 rounded text-gray-400">abc</code>.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Tablas con prefijo <code>abc_</code> · Tags: <code>abc:a</code>, <code>abc:b</code>, <code>abc:c</code>
          </p>
        </Card>
      </div>
    </div>
  );
}
