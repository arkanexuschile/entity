# Instructivo de Despliegue — Entity

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

# Instalar dependencias de producción
npm ci --omit=dev

# Configurar .env
cp .env.example .env
# Editar .env con credenciales reales
```

## 3. Variables de entorno

```bash
# Base de datos
DATABASE_URL=file:./data/entity.db

# Sesión
SESSION_SECRET=<generar string aleatorio largo>

# Google OAuth (login de usuarios)
GOOGLE_CLIENT_ID=<de Google Cloud Console>
GOOGLE_CLIENT_SECRET=<de Google Cloud Console>

# Google Sheets (cuenta de servicio, lectura del Sheet)
GOOGLE_SHEET_ID=<ID del Sheet>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<email de la cuenta de servicio>
GOOGLE_SERVICE_ACCOUNT_KEY=<clave privada, con \n literales>

# Shopify (custom app de la tienda)
SHOPIFY_SHOP_DOMAIN=<tienda.myshopify.com>
SHOPIFY_ADMIN_TOKEN=<token de Admin API>

# Puerto
PORT=3001
```

## 4. Build y migraciones

```bash
npm run build
npm run db:migrate
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

Solo Noe, solo desde `main`:

```bash
cd /var/www/entity
git pull origin main
npm ci --omit=dev
npm run build
npm run db:migrate
sudo systemctl restart entity
```

## 8. Backup de la base de datos

Cron job para respaldar `data/entity.db`:

```bash
# Agregar a crontab
0 2 * * * cp /var/www/entity/data/entity.db /var/backups/entity/entity-$(date +\%Y\%m\%d).db
# Retener últimos 30 días
0 3 * * * find /var/backups/entity -name "entity-*.db" -mtime +30 -delete
```

## 9. Credenciales de Shopify (Custom App)

Entity necesita una **custom app** en el admin de la tienda para acceder a la Admin API:

1. Ir a **Settings → Apps and sales channels → Develop apps**
2. Crear app "Entity"
3. Configurar scopes: `read_products`, `write_products`, `read_orders`, `read_collections`
4. Instalar y copiar el **Admin API access token**
5. Agregar `SHOPIFY_SHOP_DOMAIN` y `SHOPIFY_ADMIN_TOKEN` al `.env`

**Nota:** la custom app NO es una app pública. Es solo la forma que Shopify tiene de generar credenciales de API para una tienda.

## 10. Credenciales de Google

### Cuenta de servicio (Google Sheets)
1. Ir a Google Cloud Console → IAM → Service Accounts
2. Crear cuenta de servicio "Entity Sheets Reader"
3. Generar clave JSON
4. Compartir el Google Sheet con el email de la cuenta de servicio (acceso lector)

### OAuth (login de usuarios)
1. Google Cloud Console → APIs & Services → Credentials
2. Crear OAuth 2.0 Client ID (Web application)
3. Agregar URI de redirección: `https://entity.piedrabruja.cl/api/auth/callback`
4. Copiar Client ID y Client Secret al `.env`
