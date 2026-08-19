import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./data/entity.db";

// Singleton — React Router (Node) reusa el módulo entre requests.
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL"); // ver sección 3.1 del documento de arquitectura

export const db = drizzle(sqlite, { schema });
