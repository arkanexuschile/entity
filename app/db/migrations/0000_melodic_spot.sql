CREATE TABLE `bh_detalle` (
	`entry_id` integer PRIMARY KEY NOT NULL,
	`numero_boleta` text,
	`estado` text,
	`fecha_anulacion` text,
	`rut` text,
	`razon_social` text,
	`soc_prof` text,
	`brutos` integer,
	`retenido` integer,
	`pagado` integer,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cc_detalle` (
	`entry_id` integer PRIMARY KEY NOT NULL,
	`descripcion_movimiento` text,
	`saldo` integer,
	`n_documento` text,
	`sucursal` text,
	`cargo_abono` text,
	`rut_extraido` text,
	`proveedor_rut` text,
	`comentario` text,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proveedor_rut`) REFERENCES `proveedores`(`rut`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`fecha` text NOT NULL,
	`monto` integer NOT NULL,
	`glosa_type` text,
	`glosa_vendor` text,
	`tracker_id` integer,
	`semana_iso` integer,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`tracker_id`) REFERENCES `trackers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exception_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`estado` text DEFAULT 'abierta' NOT NULL,
	`resuelta_por` text,
	`resuelta_en` text,
	`comentario` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `g66_detalle` (
	`entry_id` integer PRIMARY KEY NOT NULL,
	`tipo_transaccion` text,
	`cargo` integer,
	`abono` integer,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mepa_detalle` (
	`entry_id` integer PRIMARY KEY NOT NULL,
	`tipo` text,
	`transaccion` text,
	`external_id` text,
	`moneda` text,
	`comision` integer,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proveedores` (
	`rut` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`cuenta` text,
	`banco` text,
	`email` text
);
--> statement-breakpoint
CREATE TABLE `sii_detalle` (
	`entry_id` integer PRIMARY KEY NOT NULL,
	`tipo_doc` text,
	`tipo_compra` text,
	`rut_proveedor` text,
	`razon_social` text,
	`folio` text,
	`fecha_recepcion` text,
	`fecha_acuse` text,
	`monto_exento` integer,
	`monto_neto` integer,
	`monto_iva_recuperable` integer,
	`monto_iva_no_recuperable` integer,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tc_detalle` (
	`entry_id` integer PRIMARY KEY NOT NULL,
	`establecimiento` text,
	`descripcion` text,
	`lugar` text,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tracker_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`nombre` text NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trackers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer,
	`glosa_type` text NOT NULL,
	`glosa_vendor` text NOT NULL,
	`nombre` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `tracker_categories`(`id`) ON UPDATE no action ON DELETE no action
);
