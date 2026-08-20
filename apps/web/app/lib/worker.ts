import cron from "node-cron";
import { prisma } from "@entity/database";
import { isEmailConfigured, notificarPorVencer } from "./email";

// ============================================================
// WORKER — recordatorios de tareas por vencer.
// Corre cada día a las 7:00 AM: busca tareas (status != DONE)
// cuyo dueDate esté a exactamente 2 días de hoy y dispara el
// correo al creador y al asignado.
// Ejecutar con: pnpm run worker
// ============================================================

const APP_BASE = process.env.APP_BASE_URL ?? "http://localhost:3000";

async function recordatoriosPorVencer() {
  if (!isEmailConfigured()) {
    console.log("[worker] Resend no configurado — omitiendo envíos. Configurá RESEND_API_KEY y RESEND_FROM.");
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicioVentana = new Date(hoy);
  inicioVentana.setDate(hoy.getDate() + 2);
  const finVentana = new Date(hoy);
  finVentana.setDate(hoy.getDate() + 3);

  const tareas = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: { gte: inicioVentana, lt: finVentana },
    },
    include: { assignee: true, createdBy: true },
  });

  console.log(`[worker] ${new Date().toISOString()} — ${tareas.length} tarea(s) por vencer en 2 días.`);

  for (const t of tareas) {
    const a: string[] = [];
    if (t.assignee?.email) a.push(t.assignee.email);
    if (t.createdBy?.email && !a.includes(t.createdBy.email)) a.push(t.createdBy.email);

    await notificarPorVencer(
      {
        title: t.title,
        description: t.description,
        board: t.board,
        priority: t.priority,
        dueDate: t.dueDate,
        creador: t.createdBy?.name ?? "—",
        asignado: t.assignee?.name,
        url: `${APP_BASE}/tareas`,
      },
      a
    );
  }
}

const task = cron.schedule("0 7 * * *", () => {
  recordatoriosPorVencer().catch((e) => console.error("[worker] error:", e));
});

recordatoriosPorVencer().catch((e) => console.error("[worker] error inicial:", e));

console.log("[worker] Entity worker activo — recordatorios cada día a las 07:00.");

process.on("SIGINT", () => {
  task.stop();
  process.exit(0);
});