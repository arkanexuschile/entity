import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

/**
 * Catálogo de categorías (jerarquía tomada de la hoja "Flujo" del Excel de
 * flujo de caja). Auto-referencial: parentId = null en las raíces
 * (Ingresos / Egresos). El "administrador de glosas" (CRUD sobre esta tabla
 * + la tabla `trackers`) es un módulo de la Fase 2, no de la Fase 1 — acá
 * solo se siembra y se lee.
 */
export const trackerCategories = sqliteTable("tracker_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentId: integer("parent_id"),
  nombre: text("nombre").notNull(),
  orden: integer("orden").notNull().default(0),
});

export const trackerCategoriesRelations = relations(
  trackerCategories,
  ({ one, many }) => ({
    parent: one(trackerCategories, {
      fields: [trackerCategories.parentId],
      references: [trackerCategories.id],
    }),
    trackers: many(trackers),
  })
);

/**
 * Catálogo cerrado de Trackers (Tracker = Glosa Type + "-" + Glosa Vendor).
 * Se extiende deliberadamente vía el administrador de glosas — nunca se
 * crea un tracker nuevo "al vuelo" desde una entrada.
 */
export const trackers = sqliteTable("trackers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").references(() => trackerCategories.id),
  glosaType: text("glosa_type").notNull(),
  glosaVendor: text("glosa_vendor").notNull(),
  nombre: text("nombre").notNull(), // glosaType + "-" + glosaVendor, materializado
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const trackersRelations = relations(trackers, ({ one, many }) => ({
  category: one(trackerCategories, {
    fields: [trackers.categoryId],
    references: [trackerCategories.id],
  }),
  entries: many(entries),
}));

/** Maestro de proveedores — usado para el auto-fill que ya existe en CC. */
export const proveedores = sqliteTable("proveedores", {
  rut: text("rut").primaryKey(),
  nombre: text("nombre").notNull(),
  cuenta: text("cuenta"),
  banco: text("banco"),
  email: text("email"),
});

export const sourceEnum = [
  "cc",
  "tc",
  "bh",
  "sii",
  "mepa",
  "g66",
] as const;
export type Source = (typeof sourceEnum)[number];

export const statusEnum = [
  "pendiente",
  "glosado",
  "excepcion",
  "conciliado",
] as const;
export type EntryStatus = (typeof statusEnum)[number];

/**
 * Columna vertebral, compartida por las 6 fuentes. La primera revisión
 * humana (glosar) y la segunda (conciliar) actúan sobre esta tabla; las
 * columnas específicas de cada fuente viven en las tablas *_detalle.
 */
export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source", { enum: sourceEnum }).notNull(),
  fecha: text("fecha").notNull(), // ISO date
  monto: integer("monto").notNull(), // CLP, sin decimales
  glosaType: text("glosa_type"),
  glosaVendor: text("glosa_vendor"),
  trackerId: integer("tracker_id").references(() => trackers.id),
  semanaIso: integer("semana_iso"), // calculada al insertar, para la vista agregada semanal
  status: text("status", { enum: statusEnum }).notNull().default("pendiente"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const entriesRelations = relations(entries, ({ one, many }) => ({
  tracker: one(trackers, {
    fields: [entries.trackerId],
    references: [trackers.id],
  }),
  exceptions: many(exceptionQueue),
}));

// --- Tablas de detalle por fuente (columnas propias de cada planilla) ---

export const ccDetalle = sqliteTable("cc_detalle", {
  entryId: integer("entry_id")
    .primaryKey()
    .references(() => entries.id),
  descripcionMovimiento: text("descripcion_movimiento"),
  saldo: integer("saldo"),
  nDocumento: text("n_documento"),
  sucursal: text("sucursal"),
  cargoAbono: text("cargo_abono"), // 'C' | 'A'
  rutExtraido: text("rut_extraido"),
  proveedorRut: text("proveedor_rut").references(() => proveedores.rut),
  comentario: text("comentario"),
});

export const tcDetalle = sqliteTable("tc_detalle", {
  entryId: integer("entry_id")
    .primaryKey()
    .references(() => entries.id),
  establecimiento: text("establecimiento"),
  descripcion: text("descripcion"),
  lugar: text("lugar"),
});

export const bhDetalle = sqliteTable("bh_detalle", {
  entryId: integer("entry_id")
    .primaryKey()
    .references(() => entries.id),
  numeroBoleta: text("numero_boleta"),
  estado: text("estado"), // 'VIGENTE' | 'ANULADA'
  fechaAnulacion: text("fecha_anulacion"),
  rut: text("rut"),
  razonSocial: text("razon_social"),
  socProf: text("soc_prof"),
  brutos: integer("brutos"),
  retenido: integer("retenido"),
  pagado: integer("pagado"),
});

export const siiDetalle = sqliteTable("sii_detalle", {
  entryId: integer("entry_id")
    .primaryKey()
    .references(() => entries.id),
  tipoDoc: text("tipo_doc"),
  tipoCompra: text("tipo_compra"),
  rutProveedor: text("rut_proveedor"),
  razonSocial: text("razon_social"),
  folio: text("folio"),
  fechaRecepcion: text("fecha_recepcion"),
  fechaAcuse: text("fecha_acuse"),
  montoExento: integer("monto_exento"),
  montoNeto: integer("monto_neto"),
  montoIvaRecuperable: integer("monto_iva_recuperable"),
  montoIvaNoRecuperable: integer("monto_iva_no_recuperable"),
});

export const mepaDetalle = sqliteTable("mepa_detalle", {
  entryId: integer("entry_id")
    .primaryKey()
    .references(() => entries.id),
  tipo: text("tipo"),
  transaccion: text("transaccion"),
  externalId: text("external_id"),
  moneda: text("moneda"),
  comision: integer("comision"),
});

export const g66Detalle = sqliteTable("g66_detalle", {
  entryId: integer("entry_id")
    .primaryKey()
    .references(() => entries.id),
  tipoTransaccion: text("tipo_transaccion"),
  nombreTercero: text("nombre_tercero"), // contraparte, para la sugerencia de glosas
  cargo: integer("cargo"),
  abono: integer("abono"),
});

/**
 * Bandeja única de excepciones (sección 6 del documento de arquitectura).
 * Dos disparadores: falta_glosa (falla la 1a revisión) y falta_reconciliar
 * (falla la 2a).
 *
 * Para "falta_glosa": la propuesta NO es del tracker — es de las dos
 * glosas por separado (Glosa Type y Glosa Vendor), armadas comparando la
 * contraparte de la entrada nueva (RUT extraído en CC, RUT/razón social en
 * BH/SII, etc.) contra el historial de entradas de esa misma contraparte.
 * Se muestra como un menú de hasta 6 alternativas (puede haber entre 0 y
 * 6), más la opción de ignorarlas y elegir/escribir una glosa propia. El
 * humano siempre elige — el tracker se arma después, mecánicamente,
 * concatenando las dos glosas confirmadas.
 *
 * Se resuelve en el momento, sin exigir justificación —
 * el comentario es siempre opcional (obligatorio recién en Fase 10).
 */
export const exceptionQueue = sqliteTable("exception_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id")
    .notNull()
    .references(() => entries.id),
  tipo: text("tipo", { enum: ["falta_glosa", "falta_reconciliar"] }).notNull(),
  estado: text("estado", { enum: ["abierta", "resuelta"] })
    .notNull()
    .default("abierta"),
  resueltaPor: text("resuelta_por"),
  resueltaEn: text("resuelta_en"),
  comentario: text("comentario"), // registro liviano, siempre opcional en Fase 1
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const exceptionQueueRelations = relations(exceptionQueue, ({ one }) => ({
  entry: one(entries, {
    fields: [exceptionQueue.entryId],
    references: [entries.id],
  }),
}));

// --- Sincronización con el Google Sheet ---

/**
 * Fila única (singleton) con la configuración de sincronización. Parte
 * apagada (enabled=false) — la sincronización de la Fase 1 es manual, vía
 * botón. Este registro es lo que permite prender el polling automático más
 * adelante sin cambiar de modelo de datos.
 */
export const syncSettings = sqliteTable("sync_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  frecuenciaMinutos: integer("frecuencia_minutos"), // null mientras enabled=false
  ultimaSincronizacion: text("ultima_sincronizacion"),
});

/**
 * Marca de agua por pestaña del Google Sheet — hasta qué fila ya se
 * importó. Asume que el equipo solo AGREGA filas nuevas al final de cada
 * pestaña (no edita ni inserta filas intermedias en movimientos ya
 * sincronizados) — a confirmar antes de la primera sincronización real.
 */
export const syncState = sqliteTable("sync_state", {
  pestana: text("pestana", { enum: sourceEnum }).primaryKey(),
  ultimaFilaSincronizada: integer("ultima_fila_sincronizada")
    .notNull()
    .default(1), // fila 1 = encabezados
  actualizadoEn: text("actualizado_en")
    .notNull()
    .default(sql`(current_timestamp)`),
});
