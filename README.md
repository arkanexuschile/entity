# Entity — PiedraBruja

Plataforma central de conciliación bancaria, controlling de gastos, balances, flujo de caja y reportería de márgenes de PiedraBruja. Ver `docs/ARQUITECTURA.md` para el diseño completo — este README cubre solo lo operativo.

## Stack

- React Router v8 en modo framework
- Node 22 (LTS)
- SQLite + Drizzle ORM
- Tailwind CSS
- TypeScript

## Estado actual

- **Main (infraestructura):** esqueleto de la app, schema modular, registro de módulos, docs versionados.
- **Finanzas (Fase 1):** modelo de datos completo (entries, trackers, exception_queue), sync con Google Sheets, motor de sugerencia de glosas. Sin UI todavía.
- **ABC:** pendiente (adelanto de Fase 5 del roadmap).

## Estructura del proyecto

```
app/
├── db/
│   ├── schema/          # Esquema modular por módulo
│   │   ├── index.ts     # barrel (re-exporta todo)
│   │   ├── main.ts      # tablas de infra (usuarios, roles, jobs)
│   │   ├── finanzas.ts  # entries, trackers, exception_queue, sync
│   │   └── abc.ts       # tablas ABC (placeholder)
│   ├── migrations/
│   ├── client.server.ts # cliente SQLite + Drizzle
│   ├── migrate.ts       # runner de migraciones
│   └── seed.ts          # semilla de categorías
├── lib/                 # lógica compartida
├── modules/
│   └── registry.ts      # registro de módulos (fuente única de verdad)
├── routes/              # rutas por módulo
├── components/ui/       # primitivas UI compartidas
├── root.tsx
└── routes.ts
docs/
├── ARQUITECTURA.md      # diseño global, §11 registro de módulos
├── PROMPT-COORDINACION.md  # plantilla de arranque para chats
└── DEPLOY.md            # instructivo de despliegue al Droplet
```

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar credenciales
npm run db:migrate
npm run db:seed
npm run dev
```

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run start` — sirve el build de producción.
- `npm run typecheck` — verifica tipos.
- `npm run db:generate` — genera una migración nueva.
- `npm run db:migrate` — aplica migraciones pendientes.
- `npm run db:seed` — siembra/resetea categorías.

## Coordinación

Ver `docs/PROMPT-COORDINACION.md` — cada chat nuevo de Claude arranca con ese prompt. Sin excepción.

## Despliegue

Ver `docs/DEPLOY.md`. Solo Noe despliega, solo desde `main`.
