/**
 * Runner de jobs programados.
 *
 * Ejecuta uno o todos los jobs pendientes según su frecuencia.
 * Invocado por systemd timer o manualmente.
 *
 * Uso:
 *   npx tsx app/jobs/run.ts           — ejecuta todos los jobs pendientes
 *   npx tsx app/jobs/run.ts <jobId>   — ejecuta un job específico
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { jobs } from "~/db/schema";
import { eq } from "drizzle-orm";

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./data/entity.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

type JobRunner = (job: typeof jobs.$inferSelect) => Promise<string>;

// --- Registro de runners ---
// Cada módulo registra su runner aquí.
const runners: Record<string, JobRunner> = {
  // Ejemplo: "sync_fiananzas": async (job) => { ... }
  // ABC registration sync: async (job) => { ... }
};

async function runJob(job: typeof jobs.$inferSelect): Promise<void> {
  const runner = runners[job.tipo];
  if (!runner) {
    console.log(`  ⚠ No hay runner registrado para tipo "${job.tipo}"`);
    db.update(jobs)
      .set({ ultimoEstado: "error", log: `No hay runner para tipo: ${job.tipo}` })
      .where(eq(jobs.id, job.id))
      .run();
    return;
  }

  console.log(`  ▶ Ejecutando: ${job.nombre} (${job.tipo})`);
  try {
    const log = await runner(job);
    db.update(jobs)
      .set({
        ultimoEstado: "ok",
        ultimaEjecucion: new Date().toISOString(),
        log: log || "OK",
      })
      .where(eq(jobs.id, job.id))
      .run();
    console.log(`  ✓ Completado: ${job.nombre}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Error en ${job.nombre}: ${errorMsg}`);
    db.update(jobs)
      .set({
        ultimoEstado: "error",
        ultimaEjecucion: new Date().toISOString(),
        log: errorMsg,
      })
      .where(eq(jobs.id, job.id))
      .run();
  }
}

async function main() {
  const targetId = process.argv[2] ? parseInt(process.argv[2], 10) : null;

  console.log("🕐 Entity Scheduler —", new Date().toISOString());

  if (targetId) {
    const job = db.select().from(jobs).where(eq(jobs.id, targetId)).get();
    if (!job) {
      console.error(`Job ${targetId} no encontrado`);
      process.exit(1);
    }
    await runJob(job);
  } else {
    const allJobs = db.select().from(jobs).all();
    console.log(`  ${allJobs.length} jobs en la cola`);

    for (const job of allJobs) {
      if (!job.frecuencia) {
        console.log(`  ⊘ ${job.nombre}: sin frecuencia, saltando`);
        continue;
      }
      await runJob(job);
    }
  }

  console.log("🕐 Fin del scheduler");
  sqlite.close();
}

main().catch((err) => {
  console.error("Error fatal en scheduler:", err);
  sqlite.close();
  process.exit(1);
});
