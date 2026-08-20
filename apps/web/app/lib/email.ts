import { Resend } from "resend";

// ============================================================
// CORREOS (Resend) — estructura lista para conectar.
// La API key la pone el dueño en el entorno cuando use la
// plataforma (RESEND_API_KEY + RESEND_FROM). Mientras no esté
// configurada, notifyTask* registra el envío como "skipped"
// sin fallar.
// ============================================================

let resend: Resend | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

interface CorreoBase {
  to: string[];
  subject: string;
  html: string;
}

async function enviar(correo: CorreoBase) {
  const client = getResend();
  if (!client) {
    console.log(`[email] skipped (sin RESEND_API_KEY): "${correo.subject}" -> ${correo.to.join(", ")}`);
    return { ok: false as const, skipped: true as const };
  }
  const { error } = await client.emails.send({
    from: process.env.RESEND_FROM!,
    to: correo.to,
    subject: correo.subject,
    html: correo.html,
  });
  if (error) {
    console.error("[email] error:", error);
    return { ok: false as const, error: error.message };
  }
  console.log(`[email] enviado: "${correo.subject}" -> ${correo.to.join(", ")}`);
  return { ok: true as const };
}

const dateFmt = (d: Date) =>
  new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(d);

function shell(inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f2e6cf;font-family:Arial,Helvetica,sans-serif;color:#3a2d1e">
    <div style="max-width:560px;margin:0 auto;padding:24px">
      <div style="background:#2b2418;color:#e8c776;border-radius:10px;padding:20px 24px;font-size:20px;letter-spacing:1px">
        ⚔ Entity
      </div>
      <div style="background:#fffdf7;border:1px solid #d9c9a6;border-radius:0 0 10px 10px;padding:24px;border-top:3px solid #ea580c">
        ${inner}
        <p style="margin-top:28px;color:#8a7a5e;font-size:12px;border-top:1px solid #e5d9bd;padding-top:12px">
          PiedraBruja SpA · Gremio de Piedra Bruja
        </p>
      </div>
    </div></body></html>`;
}

export interface TareaNotif {
  title: string;
  description?: string | null;
  board: string;
  priority: string;
  dueDate?: Date | null;
  creador: string;
  asignado?: string | null;
  url: string;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function notificarTareaNueva(tarea: TareaNotif, a: string[]) {
  if (a.length === 0) return { ok: false as const };
  const due = tarea.dueDate ? `Vence el <strong>${dateFmt(tarea.dueDate)}</strong>` : "Sin fecha de vencimiento";
  const desc = tarea.description?.trim()
    ? `<tr><td style="padding:6px 0;color:#8a7a5e;vertical-align:top">Observaciones</td><td style="padding:6px 0;white-space:pre-wrap">${esc(tarea.description)}</td></tr>`
    : "";
  const html = shell(`
    <h2 style="margin:0 0 8px;color:#2b2418">Nueva misión en el tablón</h2>
    <p style="color:#6d5f4a;margin:0 0 16px">Se ha registrado una nueva tarea en el gremio.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#8a7a5e">Misión</td><td style="padding:6px 0"><strong>${esc(tarea.title)}</strong></td></tr>
      ${desc}
      <tr><td style="padding:6px 0;color:#8a7a5e">Tablero</td><td style="padding:6px 0">${esc(tarea.board)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Prioridad</td><td style="padding:6px 0">${esc(tarea.priority)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Creada por</td><td style="padding:6px 0">${esc(tarea.creador)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Asignada a</td><td style="padding:6px 0">${esc(tarea.asignado ?? "Sin asignar")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Plazo</td><td style="padding:6px 0">${due}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${tarea.url}" style="background:#ea580c;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Ver en el tablón</a></p>
  `);
  return enviar({ to: a, subject: `Nueva misión: ${tarea.title}`, html });
}

export async function notificarPorVencer(tarea: TareaNotif, a: string[]) {
  if (a.length === 0) return { ok: false as const };
  const desc = tarea.description?.trim()
    ? `<tr><td style="padding:6px 0;color:#8a7a5e;vertical-align:top">Observaciones</td><td style="padding:6px 0;white-space:pre-wrap">${esc(tarea.description)}</td></tr>`
    : "";
  const html = shell(`
    <h2 style="margin:0 0 8px;color:#2b2418">⏳ Misión por vencer</h2>
    <p style="color:#6d5f4a;margin:0 0 16px">La misión vence pronto — se acerca el plazo.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#8a7a5e">Misión</td><td style="padding:6px 0"><strong>${esc(tarea.title)}</strong></td></tr>
      ${desc}
      <tr><td style="padding:6px 0;color:#8a7a5e">Tablero</td><td style="padding:6px 0">${esc(tarea.board)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Prioridad</td><td style="padding:6px 0">${esc(tarea.priority)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Creada por</td><td style="padding:6px 0">${esc(tarea.creador)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Asignada a</td><td style="padding:6px 0">${esc(tarea.asignado ?? "Sin asignar")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a7a5e">Vence</td><td style="padding:6px 0"><strong>${tarea.dueDate ? dateFmt(tarea.dueDate) : "—"}</strong></td></tr>
    </table>
    <p style="margin-top:20px"><a href="${tarea.url}" style="background:#c0552e;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Ver en el tablón</a></p>
  `);
  return enviar({ to: a, subject: `Por vencer: ${tarea.title}`, html });
}