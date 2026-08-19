import { eq, and } from "drizzle-orm";
import { db } from "~/db/client.server";
import {
  entries,
  ccDetalle,
  tcDetalle,
  bhDetalle,
  siiDetalle,
  mepaDetalle,
  g66Detalle,
  trackers,
  exceptionQueue,
  syncState,
  type Source,
} from "~/db/schema";
import { readSheetRange } from "./sheets-client.server";
import { SOURCE_CONFIG } from "./source-config.server";

const DETALLE_TABLE = {
  cc: ccDetalle,
  tc: tcDetalle,
  bh: bhDetalle,
  sii: siiDetalle,
  mepa: mepaDetalle,
  g66: g66Detalle,
} as const;

/** Serial de Google Sheets (días desde 1899-12-30) → fecha ISO (YYYY-MM-DD). */
function serialToIso(serial: unknown): string | null {
  if (typeof serial !== "number") return null;
  const epoch = Date.UTC(1899, 11, 30);
  const ms = epoch + serial * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Semana ISO (1-53) de una fecha YYYY-MM-DD. */
function isoWeek(dateIso: string): number {
  const d = new Date(dateIso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function cell(row: unknown[], index: number): unknown {
  return row[index] ?? null;
}

function asText(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).trim();
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function isRowEmpty(row: unknown[]): boolean {
  return row.every((c) => c === null || c === undefined || c === "");
}

export type SyncResult = {
  source: Source;
  filasLeidas: number;
  entradasCreadas: number;
  excepcionesCreadas: number;
  glosadasAutomaticamente: number;
};

/** Sincroniza una sola fuente (una pestaña) desde la última fila importada. */
export async function syncSource(source: Source): Promise<SyncResult> {
  const config = SOURCE_CONFIG[source];

  const estadoActual =
    db.select().from(syncState).where(eq(syncState.pestana, source)).get() ??
    (() => {
      db.insert(syncState).values({ pestana: source }).run();
      return db.select().from(syncState).where(eq(syncState.pestana, source)).get()!;
    })();

  const fromRow = Math.max(estadoActual.ultimaFilaSincronizada + 1, config.dataStartRow);
  const rows = await readSheetRange(config.tab, fromRow, config.lastColumn);

  const result: SyncResult = {
    source,
    filasLeidas: 0,
    entradasCreadas: 0,
    excepcionesCreadas: 0,
    glosadasAutomaticamente: 0,
  };

  const detalleTable = DETALLE_TABLE[source];
  let ultimaFilaProcesada = estadoActual.ultimaFilaSincronizada;

  rows.forEach((row, i) => {
    const numeroFila = fromRow + i;
    ultimaFilaProcesada = numeroFila;
    result.filasLeidas++;

    if (isRowEmpty(row)) return;

    const fecha = serialToIso(cell(row, config.columns.fecha));
    const monto = asNumber(cell(row, config.columns.monto));
    const glosaType = asText(cell(row, config.columns.glosaType));
    const glosaVendor = asText(cell(row, config.columns.glosaVendor));

    if (!fecha || monto === null) return; // fila incompleta/no parseable — se ignora, no se marca como leída como excepción de datos (ver nota abajo)

    const trackerExistente =
      glosaType && glosaVendor
        ? db
            .select()
            .from(trackers)
            .where(
              and(
                eq(trackers.glosaType, glosaType),
                eq(trackers.glosaVendor, glosaVendor)
              )
            )
            .get()
        : undefined;

    const status = trackerExistente ? "glosado" : "pendiente";

    const entryId = db
      .insert(entries)
      .values({
        source,
        fecha,
        monto,
        glosaType,
        glosaVendor,
        trackerId: trackerExistente?.id ?? null,
        semanaIso: isoWeek(fecha),
        status,
      })
      .run().lastInsertRowid as number;

    result.entradasCreadas++;
    if (trackerExistente) result.glosadasAutomaticamente++;

    const detalleValues: Record<string, unknown> = { entryId };
    for (const [campo, idx] of Object.entries(config.detalle)) {
      detalleValues[campo] = cell(row, idx);
    }
    db.insert(detalleTable).values(detalleValues as never).run();

    if (!trackerExistente) {
      db.insert(exceptionQueue)
        .values({ entryId, tipo: "falta_glosa" })
        .run();
      result.excepcionesCreadas++;
    }
  });

  db.update(syncState)
    .set({ ultimaFilaSincronizada: ultimaFilaProcesada, actualizadoEn: new Date().toISOString() })
    .where(eq(syncState.pestana, source))
    .run();

  return result;
}

export async function syncAll(): Promise<SyncResult[]> {
  const sources: Source[] = ["cc", "tc", "bh", "sii", "mepa", "g66"];
  const results: SyncResult[] = [];
  for (const source of sources) {
    results.push(await syncSource(source));
  }
  return results;
}
