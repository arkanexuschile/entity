import { db } from "~/db/client.server";
import type { Source } from "~/db/schema";
import type Database from "better-sqlite3";

/**
 * Motor de sugerencia de glosas (sección 6 del documento de arquitectura).
 *
 * IMPORTANTE — esto NO propone el tracker. Propone hasta 6 alternativas de
 * pares (Glosa Type, Glosa Vendor) ya usados antes para la MISMA
 * contraparte (mismo RUT, o mismo nombre/razón social/establecimiento
 * cuando no hay RUT), ordenados por frecuencia de uso. El humano elige una,
 * o la ignora y escribe la suya — el tracker se arma después, mecánicamente,
 * concatenando lo que el humano confirmó.
 */

export type GlosaSuggestion = {
  glosaType: string;
  glosaVendor: string;
  veces: number;
};

// Tabla de detalle y columna(s) de contraparte por fuente, en nombres de
// columna SQL reales (no índices de planilla).
const CONTRAPARTE_SQL: Record<
  Source,
  { tabla: string; rutCol?: string; nombreCol?: string }
> = {
  cc: { tabla: "cc_detalle", rutCol: "rut_extraido" },
  tc: { tabla: "tc_detalle", nombreCol: "establecimiento" },
  bh: { tabla: "bh_detalle", rutCol: "rut", nombreCol: "razon_social" },
  sii: { tabla: "sii_detalle", rutCol: "rut_proveedor", nombreCol: "razon_social" },
  mepa: { tabla: "mepa_detalle", nombreCol: "transaccion" },
  g66: { tabla: "g66_detalle", nombreCol: "nombre_tercero" },
};

/** Acceso al better-sqlite3 subyacente para consultas ad hoc con bind params. */
function raw(): Database.Database {
  return (db as unknown as { $client: Database.Database }).$client;
}

export function suggestGlosas(
  source: Source,
  contraparte: { rut?: string | null; nombre?: string | null },
  opts: { excludeEntryId?: number; limit?: number } = {}
): GlosaSuggestion[] {
  const config = CONTRAPARTE_SQL[source];
  const limit = opts.limit ?? 6;

  const clauses: string[] = [];
  const params: Record<string, unknown> = { source, limit };

  if (config.rutCol && contraparte.rut) {
    clauses.push(`d.${config.rutCol} = @rut`);
    params.rut = contraparte.rut;
  }
  if (config.nombreCol && contraparte.nombre) {
    clauses.push(`d.${config.nombreCol} = @nombre`);
    params.nombre = contraparte.nombre;
  }
  if (clauses.length === 0) {
    return []; // sin RUT ni nombre no hay con qué comparar.
  }

  let excludeClause = "";
  if (opts.excludeEntryId) {
    excludeClause = "AND e.id != @excludeEntryId";
    params.excludeEntryId = opts.excludeEntryId;
  }

  const query = `
    SELECT e.glosa_type as glosaType, e.glosa_vendor as glosaVendor, COUNT(*) as veces
    FROM entries e
    JOIN ${config.tabla} d ON d.entry_id = e.id
    WHERE e.source = @source
      AND e.glosa_type IS NOT NULL
      AND e.glosa_vendor IS NOT NULL
      AND (${clauses.join(" OR ")})
      ${excludeClause}
    GROUP BY e.glosa_type, e.glosa_vendor
    ORDER BY veces DESC, MAX(e.fecha) DESC
    LIMIT @limit
  `;

  return raw().prepare(query).all(params) as GlosaSuggestion[];
}
