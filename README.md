# Entity

ERP de PiedraBruja — ventas, compras, inventario, finanzas y operación del gremio.

**Stack:** React Router v7 · React 19 · Vite · TypeScript · PostgreSQL 16 + Prisma · pnpm + Turborepo

## Requisitos

- Node 22
- pnpm 11
- Docker (para PostgreSQL local)

## Puesta en marcha

```bash
docker compose up -d db        # levanta PostgreSQL en localhost:5435
pnpm install
pnpm --filter @entity/database db:generate
pnpm --filter @entity/database db:migrate
pnpm --filter @entity/database db:seed
pnpm dev
```

App en `http://localhost:3000`.

**Demo:** `admin@entity.local` / `entity123`

## Comandos útiles

```bash
pnpm dev                       # dev de la app
pnpm typecheck                 # typecheck en todos los paquetes
pnpm build                     # build de producción
pnpm --filter @entity/database db:seed
```

## Estado

Solo el **dashboard** (Salón del Gremio) es navegable. Los demás módulos aparecen en el sidebar como items bloqueados hasta que se desarrollen.

Documentación: `docs/` (arquitectura, deploy, prompt de coordinación).