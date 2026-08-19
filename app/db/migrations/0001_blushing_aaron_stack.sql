CREATE TABLE `sync_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`frecuencia_minutos` integer,
	`ultima_sincronizacion` text
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`pestana` text PRIMARY KEY NOT NULL,
	`ultima_fila_sincronizada` integer DEFAULT 1 NOT NULL,
	`actualizado_en` text DEFAULT (current_timestamp) NOT NULL
);
