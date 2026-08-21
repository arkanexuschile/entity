# Guía de Git — trabajar con ramas y Pull Requests

Esta guía explica cómo trabajar con **Git** y **GitHub** en el proyecto Entity, pensada para quien está empezando. No necesitas saber nada de programación para seguirla: cada paso es copiar y pegar.

---

## Índice

1. [Ideas básicas (léelo, es corto)](#1-ideas-básicas-léelo-es-corto)
2. [Preparar tu computador una sola vez](#2-preparar-tu-computador-una-sola-vez)
3. [Tu primer cambio paso a paso](#3-tu-primer-cambio-paso-a-paso)
4. [Abrir un Pull Request (PR)](#4-abrir-un-pull-request-pr)
5. [Cuando tu PR se aprueba](#5-cuando-tu-pr-se-aprueba)
6. [Actualizar tu rama con el trabajo de los demás](#6-actualizar-tu-rama-con-el-trabajo-de-los-demás)
7. [Errores comunes](#7-errores-comunes)

---

## 1. Ideas básicas (léelo, es corto)

Git es como un **historial de cambios** de todos los archivos del proyecto. Cada vez que alguien guarda un cambio, queda anotado *qué cambió*, *quién* lo cambió y *cuándo*.

- **Repositorio** = el proyecto completo con su historial (vive en GitHub).
- **Rama (branch)** = una "línea de trabajo" aparte. Todos empiezan en `main`, y cada persona crea su propia rama para trabajar sin pisarse.
- **Commit** = "guardar un punto" en tu rama. Es un cambio con un mensaje que dice qué hiciste.
- **Push** = subir tus commits de tu computador a GitHub.
- **Pull Request (PR)** = pedir que tus cambios se revisen y se unan a `main`. Ahí se discuten, se revisan y se aprueban.
- **Pull** = bajar los cambios que otros subieron.

> **La regla de oro:** nunca trabajes directo en `main`. Siempre en tu propia rama, y al final un Pull Request.

---

## 2. Preparar tu computador una sola vez

Antes de tu primer cambio, identifica quién eres para Git. Abre la Terminal en la carpeta del proyecto y escribe:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@correo.com"
```

Usa el mismo correo con el que entras a GitHub. Esto se hace una sola vez.

---

## 3. Tu primer cambio paso a paso

### 3.1 Asegúrate de tener lo más reciente

```bash
git checkout main
git pull origin main
```

### 3.2 Crea tu rama

Elige un nombre corto que describa lo que vas a hacer (sin espacios, con guiones). Ejemplos: `dashboard-ventas`, `arreglo-login`, `nueva-seccion-reportes`.

```bash
git checkout -b nombre-de-tu-rama
```

Desde ahora, todo lo que hagas queda en tu rama, sin tocar `main`.

### 3.3 Haz tus cambios

Edita los archivos que necesites (código, textos, config) y guárdalos normalmente.

### 3.4 Mira qué cambió

```bash
git status
```

Esto muestra la lista de archivos que modificaste. Lo verás en rojo (o con una "M") — es normal.

### 3.5 Prepara los archivos (stage)

```bash
git add .
```

El `.` significa "todos los archivos que cambié". Si solo quieres uno, escribe su nombre en vez del punto.

### 3.6 Guarda el punto (commit)

```bash
git commit -m "Descripción corta de lo que hice"
```

El mensaje debe decir **qué** hiciste, no *cómo*. Ejemplos buenos: `"Agrega tabla de ventas al panel"`, `"Corrige el título del login"`.

### 3.7 Sube tu rama a GitHub (push)

La primera vez, Git te pedirá que "conectes" tu rama. Copia lo que te sugiera o usa:

```bash
git push -u origin nombre-de-tu-rama
```

Después de la primera vez, basta con:

```bash
git push
```

### 3.8 Repite

Mientras trabajas, puedes repetir los pasos 3.4 a 3.7 tantas veces como quieras (cada bloque de cambios = un commit).

---

## 4. Abrir un Pull Request (PR)

Cuando hayas subido tu rama y sientas que el trabajo está listo:

1. Ve a GitHub → repositorio **entity**.
2. GitHub suele mostrar un botón amarillo **"Compare & pull request"** para tu rama recién subida. Haz clic ahí.
3. Rellena:
   - **Base**: `main` (a donde va el cambio).
   - **Compare**: tu rama (de dónde viene el cambio).
   - **Título**: qué hace el PR (ej. "Agrega panel de ventas").
   - **Descripción**: en una o dos líneas, qué cambia y por qué.
4. Presiona **Create pull request**.

Con eso, tu trabajo queda a la espera de revisión. No se une a `main` hasta que alguien lo apruebe.

---

## 5. Cuando tu PR se aprueba

Cuando el responsable del repositorio aprueba y une tu PR, puedes borrar tu rama (GitHub te lo ofrece solo, con un botón **"Delete branch"**).

Para limpiar tu computador y volver a lo más reciente:

```bash
git checkout main
git pull origin main
```

Ahora `main` en tu computador ya tiene todo, incluido tu trabajo.

---

## 6. Actualizar tu rama con el trabajo de los demás

Si alguien más unió cambios a `main` y tu rama se quedó atrás (Git puede avisarte con "conflictos"), actualiza tu rama así:

```bash
git checkout nombre-de-tu-rama
git pull origin main
```

Esto trae lo nuevo de `main` a tu rama. Si Git marca un **conflicto** (dos personas cambiaron la misma línea), no te asustes: se resuelve eligiendo qué versión dejar. Si no te sientes seguro, avisa al responsable en el PR.

---

## 7. Errores comunes

### "git no se reconoce" / "Command not found"

Git no está instalado. Descárgalo de <https://git-scm.com> e instálalo con "Siguiente" en todo. Cierra y reabre la Terminal.

### "You are not currently on a branch" / "detached HEAD"

Significa que estás en un punto del historial, no en una rama. Vuelve a tu rama:

```bash
git checkout main
```

### Quise deshacer un commit que aún no subí

```bash
git reset --soft HEAD~1
```

Esto "deshace" el último commit pero **conserva** tus cambios en los archivos. Puedes corregir y volver a commitear.

### Me equivoqué en el mensaje del último commit (aún no subido)

```bash
git commit --amend -m "Nuevo mensaje"
```

### Push rechazado ("failed to push")

Normalmente significa que tu rama se quedó atrás de `main`. Ve a la [sección 6](#6-actualizar-tu-rama-con-el-trabajo-de-los-demás) y luego reintenta el push.

---

> Si algo de esta guía no funciona o aparece un mensaje que no entiendes, detente y pregunta — es mejor pedir ayuda que forzar comandos que no conoces.