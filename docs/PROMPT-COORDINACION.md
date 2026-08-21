# Prompt de coordinación — Plantilla genérica

> Pegar este bloque al abrir cualquier chat de Claude que vaya a construir un módulo de Entity en paralelo al chat principal. Ajustar la sección "Tu módulo" según corresponda.

---

## Contexto — Proyecto Entity (PiedraBruja)

Estás colaborando en **Entity**, la plataforma central (ERP) de PiedraBruja (tienda de juegos de mesa/hobby en Shopify): ventas, compras, inventario, finanzas y operación del gremio. Entity vive **fuera de Shopify**, corre en un Droplet propio (`piedrabruja.cl`). Stack: React Router v7 en modo framework, React 19, Vite, Node 22, PostgreSQL 16 con Prisma ORM, pnpm + Turborepo, systemd, Nginx + Let's Encrypt. **Un solo repositorio Git monorepo, compartido por todos los módulos.**

Antes de escribir código, lee completos estos documentos (el usuario te los debe haber pasado):

1. **"PiedraBruja — Entity: Especificación Técnica y Diseño Global"** (`docs/ARQUITECTURA.md`) — principios de diseño, arquitectura, modelo de datos y módulos.
2. **"PiedraBruja — Entity: Instructivo de Activación del Droplet y Subdominio"** (`docs/DEPLOY.md`) — cómo se despliega, variables de entorno, credenciales.
3. **"PiedraBruja — Entity: Guía de instalación"** (`docs/SETUP.md`) — cómo levantar el proyecto localmente.

## Tu módulo: [NOMBRE DEL MÓDULO]

Alcance funcional — confírmalo con el usuario antes de fijarlo en código, no lo asumas:

- [Describir alcance funcional del módulo]
- [Pantallas que aporta]
- [Tablas que crea (con prefijo del módulo)]
- [Credenciales que necesita]

## Reglas de convivencia en el mismo repositorio (obligatorias)

1. **Nunca commitees directo a `main`.** Trabaja en tu rama propia.
2. **Prefijo `[prefijo]_` en toda tabla nueva** que agregues a `packages/database/prisma/schema.prisma`. No toques ni renombres tablas sin ese prefijo — pertenecen a otro módulo/chat.
3. **Antes de `pnpm --filter @entity/database db:migrate`**, actualiza tu rama contra el `schema.prisma` más reciente de `main`. Dos migraciones generadas en paralelo sobre versiones distintas del esquema chocan. Si detectas un conflicto, avísale al usuario en vez de forzar un merge.
4. **No modifiques archivos compartidos** (`package.json` en sus dependencias raíz, `vite.config.ts`, layout/navegación raíz, `.env.example`, `docker-compose.yml`) sin consultarlo antes — otros módulos dependen de que no cambien por sorpresa.
5. **Vas a necesitar credenciales** que hoy no existen en el `.env` de Entity. Consúltalas con el responsable del proyecto y anticípale qué scopes necesitas para que las genere — solo los que realmente vayas a usar.
6. **El despliegue al servidor se hace desde `main`.** No se despliegan ramas directamente.
7. **Cuando cierres el modelo de datos y las pantallas de tu módulo**, repórtalo al responsable del proyecto para que actualice la documentación en `docs/ARQUITECTURA.md` — así los otros chats saben qué existe y no lo duplican ni lo pisan.

Si algo de esto entra en conflicto con lo que el usuario te pide directamente en este chat, prioriza lo que el usuario diga — pero avísale explícitamente que se aparta de esta guía, para que quede registrado.
