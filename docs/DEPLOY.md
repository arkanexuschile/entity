# Instructivo de Despliegue — Entity

Entity vive en su propio subdominio: `entity.piedrabruja.cl`. El dominio raíz `piedrabruja.cl` es la tienda/sitio público, así que Entity no va ahí.

## Requisitos del Droplet

- Ubuntu 22.04+ (recomendado)
- Node 22 exacto (via nvm)
- Nginx
- Let's Encrypt (certbot)
- systemd

## 1. Configuración inicial del Droplet

```bash
# Instalar nvm y Node 22
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22

# Verificar
node -v  # v22.x.x
```

## 2. Clonar y configurar el repo

```bash
cd /var/www
git clone https://github.com/arkanexuschile/entity.git
cd entity

# Instalar dependencias
corepack enable
pnpm install --frozen-lockfile

# Configurar .env
cp .env.example .env
# Editar .env con credenciales reales
```

## 3. Variables de entorno

```bash
# Base de datos PostgreSQL (dependencia: docker compose up -d db)
DATABASE_URL=postgresql://entity:entity@localhost:5435/entity

# Sesión
SESSION_SECRET=<generar string aleatorio largo>

# URL pública de la app (para enlaces en correos)
APP_BASE_URL=https://entity.piedrabruja.cl

# Resend (notificaciones por correo) — opcional
RESEND_API_KEY=
RESEND_FROM=Entity <noreply@entity.piedrabruja.cl>

# Shopify (custom app de la tienda) — ver sección 9
SHOPIFY_SHOP_DOMAIN=<tienda.myshopify.com>
SHOPIFY_ADMIN_TOKEN=<token de Admin API>

# Puerto
PORT=3001
```

## 4. Build y migraciones

```bash
pnpm --filter @entity/database db:generate
pnpm build
pnpm --filter @entity/database db:deploy
```

## 5. Servicio systemd

Crear `/etc/systemd/system/entity.service`:

```ini
[Unit]
Description=Entity - PiedraBruja
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/entity
ExecStart=/home/<usuario>/.nvm/versions/node/v22.x.x/bin/react-router-serve ./build/server/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable entity
sudo systemctl start entity
```

## 6. Nginx + Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Configurar Nginx (ver block de configuración)
# Luego:
sudo certbot --nginx -d entity.piedrabruja.cl
```

## 7. Despliegue de actualizaciones

El despliegue se hace desde `main`:

```bash
cd /var/www/entity
git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @entity/database db:generate
pnpm build
pnpm --filter @entity/database db:deploy
sudo systemctl restart entity
```

## 8. Backup de la base de datos

Cron job para respaldar PostgreSQL (via pg_dump):

```bash
# Agregar a crontab (ajustar DATABASE_URL según .env)
DATABASE_URL=postgresql://entity:entity@localhost:5435/entity
0 2 * * * pg_dump --no-owner --no-privileges -f /var/backups/entity/entity-$(date +\%Y\%m\%d).sql "$DATABASE_URL"
# Retener últimos 30 días
0 3 * * * find /var/backups/entity -name "entity-*.sql" -mtime +30 -delete
```

## 9. Credenciales de Shopify (Custom App)

Entity necesita una **custom app** en el admin de la tienda para acceder a la Admin API:

1. Ir a **Settings → Apps and sales channels → Develop apps** (o usar el Dev Dashboard de Shopify).
2. Crear app "Entity".
3. Configurar scopes: `read_products`, `read_orders`, `read_customers`, `read_checkouts`.
4. Instalar y copiar el **Admin API access token**.
5. Agregar `SHOPIFY_SHOP_DOMAIN` y `SHOPIFY_ADMIN_TOKEN` al `.env`.

**Nota:** los scopes son de solo lectura; la app no modifica datos de la tienda.

## 10. Login de usuarios

Se usa login por **email + contraseña** (bcrypt). Los usuarios se crean con el seed:

```bash
pnpm --filter @entity/database db:seed
```

El seed crea la empresa `PiedraBruja SpA` y los usuarios de demo (`admin@entity.local` / `entity123`, `mille@entity.local`, etc.). En producción, reemplazar las contraseñas o crear los usuarios directamente en la base de datos.
