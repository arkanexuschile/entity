# Entity

**Entity** es la plataforma central de **PiedraBruja**: un solo lugar para ver y administrar las ventas, el catálogo, el inventario, las finanzas, las campañas y la operación del gremio.

## ¿Qué hace?

Reúne en un solo panel la información que hoy vive dispersa (tienda Shopify, planillas, correos) y la muestra de forma clara:

- **Salón del Gremio** — el panel principal con los indicadores del negocio.
- **Ventas, Compras, Inventario** — los movimientos comerciales y el stock.
- **Finanzas y Contabilidad** — ingresos, gastos, márgenes y asientos.
- **Campañas, Tareas, Reportes, Carritos** — el lado de marketing y operación.

Además, se conecta con servicios externos para traer datos reales en lugar de cargarlos a mano:

- **Shopify** — sincroniza el catálogo, los pedidos y los carritos abandonados de la tienda.
- **Resend** — envía correos (recordatorios y notificaciones).
- **Lorien / Defontana** — origen de documentos tributarios (DTE).

## Tecnología

La plataforma está construida con herramientas modernas y muy usadas en la industria:

| Herramienta | Para qué sirve |
|---|---|
| **React Router / React** | La interfaz web |
| **TypeScript** | Código con menos errores |
| **PostgreSQL** | Base de datos (donde se guarda todo) |
| **Prisma** | Forma de leer y escribir la base de datos |
| **Node.js** | El motor que hace funcionar la app |
| **pnpm + Turborepo** | Organización del proyecto en partes |

## Puesta en marcha (resumen)

Para levantar Entity en tu computador:

1. Instala **Node.js**, **pnpm** y **Docker** (guía completa: [`docs/SETUP.md`](docs/SETUP.md)).
2. Clona el repositorio y entra a la carpeta.
3. Copia el archivo `.env.example` a `.env`.
4. Levanta la base de datos con `docker compose up -d db`.
5. Instala dependencias y prepara la base: `pnpm install`, luego los comandos de la base de datos.
6. Inicia la app con `pnpm dev` y abre `http://localhost:3000`.

> La guía paso a paso, pensada para quien no es del mundo informático, está en **[`docs/SETUP.md`](docs/SETUP.md)**.

## Comandos útiles

```bash
pnpm dev            # Iniciar la app en modo desarrollo
pnpm typecheck      # Revisar errores de tipos
pnpm build          # Preparar la versión de producción
pnpm db:seed        # Cargar datos de demostración
```

## Documentación

- [`docs/SETUP.md`](docs/SETUP.md) — guía de instalación paso a paso.
- [`docs/GUIA-GIT.md`](docs/GUIA-GIT.md) — cómo trabajar con ramas y Pull Requests.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — cómo está construido el proyecto.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — cómo se publica en el servidor.
- [`docs/PROMPT-COORDINACION.md`](docs/PROMPT-COORDINACION.md) — guía de trabajo en equipo sobre el repositorio.