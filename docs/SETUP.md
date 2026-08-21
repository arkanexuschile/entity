# Guía de instalación — Entity

Esta guía te explica, paso a paso, cómo instalar **Entity** en tu computador para poder usarlo o desarrollarlo. Está escrita para que pueda seguirla una persona sin experiencia en programación: cada término nuevo se explica en su primera aparición.

---

## Índice

1. [Qué necesitas instalar](#1-qué-necesitas-instalar)
2. [Instalar los programas](#2-instalar-los-programas)
3. [Descargar el proyecto](#3-descargar-el-proyecto)
4. [Configurar los datos de acceso](#4-configurar-los-datos-de-acceso)
5. [Levantar la base de datos](#5-levantar-la-base-de-datos)
6. [Instalar las dependencias](#6-instalar-las-dependencias)
7. [Preparar la base de datos](#7-preparar-la-base-de-datos)
8. [Iniciar la aplicación](#8-iniciar-la-aplicación)
9. [Problemas comunes y soluciones](#9-problemas-comunes-y-soluciones)

---

## 1. Qué necesitas instalar

Antes de empezar, revisa que tengas tres programas. Los tres son gratuitos:

| Programa | Qué es | Por qué lo necesitas |
|---|---|---|
| **Node.js** | Un "motor" que ejecuta la aplicación | La app está escrita para funcionar sobre Node |
| **pnpm** | Un administrador de programas (dependencias) | Descarga y organiza las piezas que usa la app |
| **Docker Desktop** | Un "contenedor" de servicios | Levanta la base de datos sin instalar nada más |

---

## 2. Instalar los programas

### 2.1 Node.js

1. Entra a <https://nodejs.org>.
2. Descarga la versión **LTS** (la que dice "LTS" — es la más estable).
3. Ejecuta el instalador y acepta todo con "Siguiente".

### 2.2 pnpm

Una vez instalado Node.js, pnpm se instala con un comando. Abre la **Terminal**:

- En **Windows**: escribe `cmd` en el menú de inicio y abre "Símbolo del sistema". O mejor, abre **PowerShell**.
- En **Mac**: abre la app "Terminal" (está en Utilidades).

Pega este comando y presiona Enter:

```bash
npm install -g pnpm
```

Para verificar que quedó bien, escribe:

```bash
pnpm --version
```

Debe aparecer un número (por ejemplo `11.17.0`).

### 2.3 Docker Desktop

1. Entra a <https://www.docker.com/products/docker-desktop/>.
2. Descarga la versión para tu computador (Windows o Mac).
3. Instálala y **abre Docker Desktop** al menos una vez para que arranque.
4. En Windows es posible que pida habilitar la virtualización (WSL 2). Docker te guía sola; si aparece un aviso de "virtualization", activa las opciones que te indique y **reinicia el computador**.

> Verifica que Docker quedó funcionando: en la Terminal escribe `docker --version`. Debe mostrar un número.

#### 2.3.1 Windows: habilitar WSL 2 paso a paso

En computadores con Windows, Docker Desktop usa WSL 2 para funcionar. Si al abrir Docker aparece el aviso **"Virtualization support not detected"** o **"WSL 2 installation is incomplete"**, es porque faltan activar componentes de Windows. Esto se arregla así:

1. Abre la **Terminal como administrador**:
   - Escribe `PowerShell` en el menú de inicio.
   - Haz clic derecho sobre "Windows PowerShell" → **Ejecutar como administrador**.
2. Pega estos comandos **uno por uno** (presiona Enter después de cada uno):

   ```bash
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart
   Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
   Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -All -NoRestart
   ```

   Cada uno mostrará un mensaje. Si dice `RestartNeeded : True`, es normal: hay que reiniciar.

3. **Reinicia el computador.**
4. Después de reiniciar, vuelve a abrir la Terminal (puede ser normal, no hace falta admin) y actualiza el sistema WSL:

   ```bash
   wsl --update
   ```

   Debe mostrar algo como "Se ha instalado el Subsistema de Windows para Linux".

5. Verifica que WSL esté en versión 2:

   ```bash
   wsl --status
   ```

   Debe decir "Versión predeterminada: 2".

6. Abre **Docker Desktop** de nuevo. Esta vez debe arrancar sin el aviso.

> **¿Por qué pasa esto?** Windows trae "apagadas" unas funciones que permiten ejecutar programas de Linux dentro del computador. Docker las necesita. Los comandos de arriba solo las encienden — no borran nada ni afectan otros programas.

> **Nota:** si el aviso dice "Virtualization support not detected" pero los pasos de arriba no lo resuelven, es posible que la **virtualización esté apagada en el BIOS** de la computadora. En ese caso hay que encenderla en el inicio del equipo (la tecla suele ser F2, F10 o Supr, depende de la marca). Busca en internet "<marca de tu computador> habilitar virtualización BIOS".

---

## 3. Descargar el proyecto

El código está guardado en un repositorio (una carpeta compartida en internet, tipo Google Drive pero para código).

1. Abre <https://github.com/arkanexuschile/entity>.
2. Si es la primera vez, tendrás que **iniciar sesión** con tu cuenta de GitHub.
3. En la página del proyecto, busca el botón verde **Code** → **Copy** y copia la dirección (por ejemplo `https://github.com/arkanexuschile/entity.git`).

Ahora, en la Terminal, navega a la carpeta donde quieras guardar el proyecto (por ejemplo `C:\PiedraBruja` en Windows) y escribe:

```bash
git clone https://github.com/arkanexuschile/entity.git
cd entity
```

Esto crea una carpeta llamada `entity` con todo el proyecto adentro.

> Si `git` no está instalado, descárgalo de <https://git-scm.com> e instálalo con "Siguiente" en todo.

---

## 4. Configurar los datos de acceso

El proyecto necesita un archivo de configuración con datos de acceso (por ejemplo, la contraseña de la base de datos). Ese archivo **no se sube a internet** por seguridad, así que hay que crearlo localmente.

1. Dentro de la carpeta `entity`, busca el archivo llamado `.env.example`.
2. Cópialo y renombra la copia a **`.env`** (sin la parte "example").

   - En **Windows**: abre la carpeta, ve a "Ver" y activa "Elementos ocultos" para poder ver el archivo. Copia el archivo, pégalo y renómbralo.
   - En **Mac**: en la Terminal escribe `cp .env.example .env`.

3. Abre el archivo `.env` con el Bloc de notas (Windows) o TextEdit (Mac) y revisa los datos. Para empezar, **no tienes que cambiar nada**: los valores que trae por defecto funcionan para desarrollo local.

---

## 5. Levantar la base de datos

La base de datos es donde se guardan todos los datos (ventas, productos, usuarios). La levantamos con Docker.

En la Terminal (dentro de la carpeta `entity`), escribe:

```bash
docker compose up -d db
```

La primera vez tardará un poco (descarga la imagen de la base de datos). Cuando termine, puedes verificar que quedó arriba con:

```bash
docker compose ps
```

Debes ver una fila con el nombre `entity-db` y el estado `Up` (o "running").

---

## 6. Instalar las dependencias

Las "dependencias" son las piezas de código que la app necesita para funcionar. Se descargan con pnpm.

En la Terminal:

```bash
pnpm install
```

Esto puede tardar unos minutos la primera vez. Cuando termine, crea una carpeta `node_modules` dentro del proyecto (es normal, es donde quedan guardadas las piezas).

---

## 7. Preparar la base de datos

Ahora hay que "crear las tablas" de la base de datos y poner algunos datos de prueba.

```bash
pnpm --filter @entity/database db:generate
pnpm --filter @entity/database db:migrate
pnpm --filter @entity/database db:seed
```

- **generate**: prepara el código que habla con la base de datos.
- **migrate**: crea las tablas.
- **seed**: carga datos de demostración (una empresa, usuarios de prueba, productos, etc.).

> El `db:seed` solo se usa para desarrollo o pruebas. En producción los datos reales llegan por las sincronizaciones.

---

## 8. Iniciar la aplicación

Por fin, a encenderla:

```bash
pnpm dev
```

La Terminal mostrará un mensaje como:

```
Local:   http://localhost:3000/
```

Abre tu navegador (Chrome, Edge, Safari...) y entra a **<http://localhost:3000>**.

Verás la pantalla de ingreso. Usa estos datos de demostración:

| Campo | Valor |
|---|---|
| Email | `admin@entity.local` |
| Contraseña | `entity123` |

¡Listo! Ya estás dentro del panel de Entity.

> Para detener la aplicación, ve a la Terminal y presiona `Ctrl + C`.

---

## 9. Problemas comunes y soluciones

### "El puerto 3000 ya está en uso" / la app no abre

Otra aplicación está usando el mismo lugar. Prueba cambiar el puerto:

```bash
pnpm --filter @entity/web dev --port 3001
```

Y abre <http://localhost:3001>.

### "Can't reach database server at `localhost:5435`"

La base de datos no está corriendo. Revisa:

1. Que **Docker Desktop esté abierto**.
2. Que la base esté arriba: `docker compose ps` (debe mostrar `entity-db` en estado `Up`).
3. Si no está, levántala: `docker compose up -d db`.

### "Docker no arranca / error de virtualización" (Windows)

Es el problema más común en Windows. Sigue la sección [2.3.1 Windows: habilitar WSL 2 paso a paso](#231-windows-habilitar-wsl-2-paso-a-paso): activar las funciones de Windows, reiniciar, y actualizar WSL.

### "fatal: could not read Username" / GitHub pide usuario y contraseña

Al clonar, GitHub pide identificación. Usa tu cuenta de GitHub. Si es la primera vez, es normal que pida usuario y contraseña (o un token). Para evitar repetirlo, sigue la [guía de Git](GUIA-GIT.md).

### "Command not found: pnpm" / "pnpm no se reconoce"

pnpm no quedó instalado. Vuelve a la [sección 2.2](#22-pnpm) y ejecuta `npm install -g pnpm`. En Windows, a veces hay que **cerrar y reabrir** la Terminal después de instalar.

### Cambié algo y la app no lo refleja

Si el navegador muestra algo raro, recarga con `Ctrl + Shift + R` (recarga forzada). Si sigue, detén la app (`Ctrl + C`) y vuelve a iniciarla con `pnpm dev`.

---

## ¿Y ahora qué?

- Para entender cómo está construido el proyecto: [`ARQUITECTURA.md`](ARQUITECTURA.md).
- Para saber cómo se conecta con Shopify y otros servicios: sección "Integraciones" en la arquitectura.
- Para trabajar con ramas y Pull Requests: [`GUIA-GIT.md`](GUIA-GIT.md).
- Para ver cómo se publica en el servidor: [`DEPLOY.md`](DEPLOY.md).