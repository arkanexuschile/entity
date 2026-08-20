# PiedraBruja — Entity: Especificación Técnica y Diseño Global

## 1. Visión general

Entity es la plataforma central de PiedraBruja: ERP de ventas, compras, inventario, finanzas y operación del gremio. Corre en un Droplet propio (`entity.piedrabruja.cl`).

**Stack:** React Router v7 en modo framework, React 19, Vite, Node 22, TypeScript, PostgreSQL 16 + Prisma ORM, pnpm + Turborepo (monorepo), systemd, Nginx + Let's Encrypt.

**Repositorio:** `arkanexuschile/entity` (GitHub). Un solo repositorio monorepo.

## 2. Principios de diseño

- **Un solo lenguaje/stack**, sin variaciones. TypeScript, React Router v7, Node 22 exacto, PostgreSQL + Prisma.
- **Monorepo pnpm + Turborepo**: `apps/web` (la app), `packages/database` (Prisma + seed), `packages/tsconfig` (config base).
- **Un solo lugar de verdad** para la documentación, versionado con el código (`docs/`).
- **Convención de nombres**, no de gusto personal. Paquetes con scope `@entity/*`. CSS puro con tokens (tema grimorio).

## 3. Arquitectura

### 3.1 Base de datos

PostgreSQL 16 con Prisma ORM. El esquema vive en `packages/database/prisma/schema.prisma`. Migraciones con `prisma migrate`.

**Comandos** (desde la raíz del repo):

```bash
pnpm --filter @entity/database db:generate   # genera Prisma Client
pnpm --filter @entity/database db:migrate    # crea migración (dev)
pnpm --filter @entity/database db:deploy     # aplica migraciones (prod)
pnpm --filter @entity/database db:seed       # datos demo
```

**Base local:** Docker (ver `docker-compose.yml`) en `localhost:5435`, db `entity` / user `entity` / pass `entity`.

### 3.2 Módulos

| Módulo | Estado |
|--------|--------|
| Dashboard (Salón del Gremio) | Activo |
| Login | Activo |
| Ventas, Compras, Inventario, Finanzas, Campañas, Tareas, Contabilidad, Reportes, Carritos | Bloqueados (se muestran en el sidebar, no abribles) |

El plan actual: **solo el dashboard es navegable**. Los demás módulos aparecen en el sidebar como items bloqueados hasta que se desarrollen.

### 3.3 Autenticación

Email + contraseña (hash bcrypt). Roles: ADMIN, MANAGER, MARKETING, BODEGA, DISENO. Permisos por módulo.

## 4. Conexión con integraciones

- **Resend** — notificaciones por correo (ver `apps/web/app/lib/email.ts`). Sin API key, el envío se registra como "skipped" sin fallar.
- **Lorien / Defontana** — origen DTE (proxy PDF). Vacío = `/api/ventas/:id/pdf` devuelve vista imprimible.
- **Shopify** — sync de productos/carritos (en el módulo Campañas/Carritos).

## 5. Coordinación

Ver `docs/PROMPT-COORDINACION.md` para el prompt de arranque obligatorio.