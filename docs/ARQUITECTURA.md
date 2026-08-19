# PiedraBruja — Entity: Especificación Técnica y Diseño Global

## 1. Visión general

Entity es la plataforma central de conciliación bancaria, controlling de gastos, balances, flujo de caja y reportería de márgenes de PiedraBruja. Corre fuera de Shopify en un Droplet propio (`entity.piedrabruja.cl`).

**Stack:** React Router v8 en modo framework, Node 22, SQLite + Drizzle ORM, systemd, Nginx + Let's Encrypt.

**Repositorio:** `arkanexuschile/entity` (GitHub). Un solo repositorio compartido por todos los módulos.

## 2. Principios de diseño

- **Un solo lenguaje/stack**, sin variaciones. TypeScript, React Router v8, Node 22 exacto, SQLite + Drizzle ORM.
- **Un solo repositorio**, con ramas por dueño.
- **Un solo lugar de verdad** para la documentación, versionado con el código (`docs/`).
- **Prompt de arranque obligatorio** en cada chat nuevo de Claude.
- **Convención de nombres**, no de gusto personal. Rama = nombre corto del módulo. Prefijo de tabla = nombre corto + `_`. Prefijo de tag/metafield = mismo criterio.

## 3. Arquitectura

### 3.1 Base de datos

SQLite con Drizzle ORM. Modo WAL habilitado. Migraciones secuenciales generadas con `drizzle-kit`.

**Convención de migraciones:** antes de `npm run db:generate`, actualizar contra `main`. Si la numeración chocó, borrar la migración local vencida y regenerar. El que mergea segundo renumeriza.

### 3.2 Esquema modular

El esquema vive en `app/db/schema/` dividido por módulos:

```
app/db/schema/
├── index.ts        # barrel (re-exporta todo)
├── main.ts         # tablas de infraestructura (usuarios, roles, jobs)
├── finanzas.ts     # entries, trackers, exception_queue, sync
└── abc.ts          # tablas del módulo ABC
```

Cada módulo edita **solo su archivo** y agrega su re-export al barrel.

### 3.3 Autenticación

Usuario + contraseña (hash bcrypt). Roles: owner, admin, miembro. Permisos por módulo. Google OAuth queda como opción futura si se necesita.

## 4. Módulos del roadmap

| Módulo | Estado | Rama | Dueño |
|--------|--------|------|-------|
| Main (infraestructura) | Activo | main | Noe |
| Finanzas (conciliación) | Fase 1 completada | main | Germán |
| ABC (clasificación SKU) | Pendiente | abc | Germán |
| Compras | Diseño inicial | — | — |
| Venta | Diseño inicial | — | — |
| Estrategias | Diseño inicial | — | — |
| Marketing | Sin diseño | — | — |
| Gestión (KPI) | Sin diseño | — | — |
| Finanzas (glosas) | Pendiente | finanzas | Germán |
| WEB | Sin diseño | — | — |
| Licitaciones | Sin diseño | — | — |
| Distribuidora | Sin diseño | — | — |

## 5. Conexión con Shopify

Cliente centralizado en `app/lib/shopify.server.ts`. Custom app de la tienda (credenciales en `.env`: `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`). Rate limiting, retry, modo dry-run.

## 6. Bandeja de excepciones

Patrón reutilizable para resolución de errores: entrada falla → se encola → humano resuelve → se procesa. Usado en finanzas (glosas) y Futuros módulos.

## 7. Coordinación multi-equipo

Ver `docs/PROMPT-COORDINACION.md` para el prompt de arranque obligatorio.

## 11. Registro de módulos

| Módulo | Rama | Dueño | Prefijo tabla | Prefijo tag | Tablas | Rutas | Credenciales |
|--------|------|-------|---------------|-------------|--------|-------|--------------|
| Main | main | Noe | (infra) | — | users, roles, jobs, sync_* | /, /login, /api/* | Google Service Account (Sheets) |
| Finanzas | main | Germán | (sin prefijo) | un: | entries, tracker_*, proveedores, *_detalle, exception_queue | /finanzas/* | Google Sheet (lectura) |
| ABC | abc | Germán | abc_ | abc: | — | /abc/* | Shopify Admin API |

**Nota:** al agregar un módulo nuevo, registrar aquí antes de empezar a codear.
