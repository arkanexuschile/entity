# PiedraBruja — Entity: Especificación Técnica y Diseño Global

## 1. Visión general

Entity es la plataforma central de PiedraBruja: ERP de ventas, compras, inventario, finanzas y operación del gremio. Vive fuera de Shopify (en un servidor propio) y se conecta con servicios externos para traer datos reales.

**Stack:** React Router v7 en modo framework, React 19, Vite, Node 22, TypeScript, PostgreSQL 16 + Prisma ORM, pnpm + Turborepo (monorepo), systemd, Nginx + Let's Encrypt.

**Repositorio:** `arkanexuschile/entity` (GitHub). Un solo repositorio monorepo.

## 2. Principios de diseño

- **Un solo lenguaje/stack**, sin variaciones. TypeScript, React Router v7, Node 22, PostgreSQL + Prisma.
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

| Módulo | Función |
|--------|---------|
| Salón del Gremio | Panel principal con indicadores del negocio |
| Ventas | Facturas de venta, clientes, stock FIFO |
| Compras | Compras y proveedores |
| Inventario | Ítems, bodegas, existencias |
| Finanzas | Ingresos, gastos, márgenes, flujo |
| Campañas | Campañas de marketing y atribución |
| Tareas | Tablón de misiones y recordatorios |
| Contabilidad | Asientos contables (gl_entries) |
| Reportes | Reportería |
| Carritos | Carritos abandonados de la tienda |

### 3.3 Autenticación

Email + contraseña (hash bcrypt). Roles: ADMIN, MANAGER, MARKETING, BODEGA, DISENO. Permisos por módulo (`UserModulePermission`).

### 3.4 Capas del proyecto

```
apps/web/app/
├── routes/            # Páginas (login, home/dashboard, layout)
├── routes.ts          # Definición de rutas
├── lib/
│   ├── auth.server.ts      # Autenticación y sesión
│   ├── session.server.ts   # Manejo de sesión (cookie)
│   ├── permissions.ts      # Permisos por rol/módulo
│   ├── ingestion.ts        # Pipeline: ingiere facturas y compras
│   ├── shopify.server.ts   # Cliente Shopify (productos, pedidos, carritos)
│   ├── finanzas.ts         # Resumen financiero del dashboard
│   ├── campanas.ts         # Análisis y recomendaciones de campañas
│   ├── email.ts            # Notificaciones (Resend)
│   └── worker.ts           # Tareas programadas (cron)
├── components/icons.tsx    # Íconos SVG propios
└── app.css                 # Estilos (tema grimorio, CSS puro con tokens)

packages/database/
├── prisma/
│   ├── schema.prisma       # Modelo de datos completo
│   ├── migrations/         # Migraciones aplicadas
│   └── seed.ts             # Datos de demostración
└── src/client.ts           # Instancia del Prisma Client
```

## 4. Conexión con integraciones

- **Shopify** (`lib/shopify.server.ts`) — Admin API de la tienda. Sincroniza:
  - **Productos** → `Item` (catálogo).
  - **Pedidos** → `SalesInvoice` (con UTM de `landing_site` y `sourceName`), actualiza stock FIFO.
  - **Carritos abandonados** → `AbandonedCart`.
  - Requiere en `.env`: `SHOPIFY_SHOP_DOMAIN` y `SHOPIFY_ADMIN_TOKEN` (scopes: `read_products`, `read_orders`, `read_customers`, `read_checkouts`).
- **Resend** (`lib/email.ts`) — notificaciones por correo. Sin API key, el envío se registra como "skipped" sin fallar.
- **Lorien / Defontana** — origen de documentos tributarios (DTE). Vacío = `/api/ventas/:id/pdf` devuelve vista imprimible.
- **IngestLog** — registro de cada sincronización por fuente (Shopify, Lorien, Defontana, GA4, Seed), usado como semáforo de salud de datos en el dashboard.

## 5. Coordinación

Ver `docs/PROMPT-COORDINACION.md` para el prompt de arranque obligatorio.