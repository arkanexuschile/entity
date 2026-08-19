/**
 * Tablas de infraestructura del Main — usuarios, roles, jobs.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Usuarios del sistema. Roles: owner (dueño total), admin (puede todo),
 * miembro (acceso limitado a módulos asignados).
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nombre: text("nombre").notNull(),
  role: text("role", { enum: ["owner", "admin", "miembro"] })
    .notNull()
    .default("miembro"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

/**
 * Jobs programados para el scheduler (Fase G).
 */
export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  tipo: text("tipo").notNull(),
  frecuencia: text("frecuencia"), // cron expression o null
  ultimaEjecucion: text("ultima_ejecucion"),
  ultimoEstado: text("ultimo_estado", {
    enum: ["ok", "error", "pendiente"],
  }),
  log: text("log"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
