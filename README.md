# 3D PIXEL — Tienda online (tomatodos, jarros y más)

Tienda web completa desarrollada con **Next.js 16 + TypeScript + Tailwind CSS + Prisma (SQLite)**.

## Características

- Catálogo de productos con categorías (tomatodos, jarros, otros), búsqueda y filtros.
- **Galería multimedia por producto**: varias fotos y videos cortos, con flechas de navegación y deslizamiento táctil (carrusel).
- **Paleta de colores editable por producto**: el administrador define cuántos colores tiene la paleta y los elige por HEX, RGB o arrastrando el mouse (selector de color). La paleta se muestra al cliente en la ficha del producto.
- **Precios por cantidad** (opcional): precio normal (1-11 und), docena (12-23), 2 docenas (24-35), 3 docenas (36-47) y más de 3 docenas (48+).
- **Carrito de compras** y checkout por **WhatsApp**: el pedido llega con cada producto, cantidad, precio unitario aplicado y el total.
- **Panel de administración** (login) para crear, editar y eliminar productos, subir fotos/videos y editar la paleta de colores.
- Base de datos **SQLite** (sin necesidad de instalar MySQL/Postgres).

---

## 1. Requisitos

- **Node.js 20 o superior** (recomendado: Node 20 LTS o 22 LTS) — https://nodejs.org
- **npm** (viene con Node.js). También puedes usar Bun si lo prefieres.
- ~500 MB de espacio en disco.

> Opcional: **Docker** y **Docker Compose** si prefieres desplegar con contenedores (ver sección 6).

## 2. Contenido del paquete

```
3d-pixel-web/
├─ src/                  Código fuente (páginas, componentes, API)
├─ prisma/               Esquema de base de datos y scripts de datos de ejemplo
│  ├─ schema.prisma      Modelo de datos (Product, ProductMedia, AdminUser)
│  ├─ seed.ts            Crea 10 productos de ejemplo (solo con la base vacía)
│  └─ seed-admin.ts      Crea/restablece el usuario administrador
├─ db/
│  └─ custom.db          ⬅ BASE DE DATOS YA LISTA, con tus 10 productos y el admin
├─ public/
│  ├─ images/            Fotos de los productos y banners
│  └─ uploads/           Aquí se guardan las fotos/videos que subas como admin
├─ .env.example          Plantilla de variables de entorno
├─ Dockerfile / docker-compose.yml   Despliegue con Docker (opcional)
└─ package.json          Dependencias y comandos
```

## 3. Instalación rápida (Node.js)

```bash
# 1. Entra a la carpeta del proyecto
cd 3d-pixel-web

# 2. Instala las dependencias
npm install

# 3. Crea tu archivo de entorno a partir de la plantilla
cp .env.example .env

# 4. Genera el cliente de Prisma (necesario)
npx prisma generate

# 5. ¡Listo! La base de datos YA VIENE incluida (db/custom.db)
#    con tus 10 productos y el usuario admin. No necesitas seed.
```

### Modo desarrollo

```bash
npm run dev
# Abre http://localhost:3000
```

### Producción

```bash
npm run build
npm start            # sirve en el puerto 3000
# Para otro puerto:  PORT=8080 npm start
#   o bien:           npx next start -p 8080
```

> En producción usa siempre `npm run build` + `npm start` (no `npm run dev`).

## 4. Acceso al panel de administración

1. En la tienda, presiona el botón de inicio de sesión (esquina superior).
2. Usuario: **admin** — Contraseña: **pixel3d2025**.
3. Ya dentro del panel podrás:
   - Crear/editar/eliminar productos.
   - Subir **múltiples fotos y videos cortos** por producto (JPG/PNG/WEBP/GIF hasta 5 MB; MP4/WEBM/MOV hasta 30 MB).
   - Editar la **paleta de colores** de cada producto (cantidad de colores y selección por HEX, RGB o arrastrando el mouse).
   - Definir **precios por cantidad** (docena, 2 docenas, 3 docenas, 48+).

### Cambiar la contraseña del administrador

La contraseña vive en la base de datos (tabla `AdminUser`). Para cambiarla:

```bash
# 1. Edita prisma/seed-admin.ts y cambia la línea:
#      const PASSWORD = 'pixel3d2025'      ->  pon tu nueva contraseña
# 2. Ejecuta:
npx tsx prisma/seed-admin.ts
```

## 5. Base de datos y respaldos

- Motor: **SQLite**, un solo archivo: **`db/custom.db`**.
- Para respaldar la tienda completa copia:
  - `db/custom.db` (productos, admin, precios, paletas)
  - `public/uploads/` (fotos y videos subidos por el administrador)
- Si algún día quieres empezar de cero con productos de ejemplo:

```bash
npm run db:push     # crea las tablas
npm run db:seed     # SOLO con la base vacía (crearía duplicados si ya hay productos)
```

## 6. Despliegue en tu servidor

### Opción A — Node.js directo

```bash
npm install
cp .env.example .env
npm run build
npm start           # o PORT=80 npm start
```

Para que quede corriendo de forma permanente, usa **pm2**:

```bash
npm install -g pm2
pm2 start npm --name tienda-3d-pixel -- start
pm2 save            # restaura tras reiniciar el servidor (pm2 startup)
```

### Opción B — Docker (recomendada por su simplicidad)

```bash
docker compose up -d --build
# La tienda queda en http://localhost:3000
```

Los `volumes` del `docker-compose.yml` conservan la base de datos (`./db`) y las fotos/videos subidos (`./public/uploads`) aunque reconstruyas la imagen.

Para servir en el puerto 80 directamente, cambia `"3000:3000"` por `"80:3000"` en `docker-compose.yml`.

### HTTPS y dominio (proxy inverso)

Coloca Nginx/Caddy/Apache delante de la app y redirige todo a `http://127.0.0.1:3000`. Ejemplo mínimo con Nginx:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    client_max_body_size 35M;   # importante para subir videos

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> `client_max_body_size` es clave: sin ella, los videos grandes darán error 413 al subirlos.

## 7. Variables de entorno (archivo `.env`)

| Variable       | Para qué sirve                                              | Valor por defecto            |
| -------------- | ----------------------------------------------------------- | ---------------------------- |
| `DATABASE_URL` | Ruta del archivo SQLite (relativa a la carpeta `prisma/`)   | `file:../db/custom.db`       |
| `AUTH_SECRET`  | Secreto con el que se firman las sesiones del administrador | `3dpixel-store-secret-v1`    |

**Cambia `AUTH_SECRET` en producción** por una cadena larga y aleatoria (invalida las sesiones abiertas, pero solo afecta al admin).

## 8. Personalización útil

| Qué cambiar                       | Dónde                                                              |
| --------------------------------- | ------------------------------------------------------------------ |
| Número de WhatsApp de la tienda   | `src/lib/whatsapp.ts` (`WHATSAPP_PHONE` y `WHATSAPP_DISPLAY`)       |
| Nombre, logo y colores de marca   | `src/components/store/header.tsx`, `footer.tsx`, `src/app/layout.tsx`, `public/logo-3dpixel.png` |
| Colores del tema                  | `src/app/globals.css` (variables de Tailwind)                       |
| Contraseña del admin              | `prisma/seed-admin.ts` (ver sección 4)                              |

Después de cambiar código: `npm run build && npm start` (o reinicia `pm2`/`docker compose up -d --build`).

## 9. Notas técnicas

- Las fotos subidas se optimizan automáticamente (formato WEBP, máx. 1200 px) y los videos se guardan tal cual.
- Los archivos subidos se sirven por la ruta `/api/uploads/[archivo]`, por lo que siempre se muestran recientes sin problema de caché.
- La base de datos y los archivos subidos son **los únicos datos que debes respaldar**.
- Para mover la tienda a otro servidor: copia todo el proyecto, y si el sistema cambia de ruta absoluta, solo verifica el `.env` (con la ruta relativa por defecto no hay que tocar nada).

## 10. Solución de problemas

| Problema | Solución |
| -------- | -------- |
| `Error: Environment variable not found: DATABASE_URL` | Falta el archivo `.env`. Ejecuta `cp .env.example .env` |
| No puedo iniciar sesión como admin | Verifica usuario `admin` / `pixel3d2025`; si lo cambiaste, repite la sección 4 |
| Error al subir un video | Revisa el límite del proxy (`client_max_body_size`) y el tamaño (máx. 30 MB) |
| Puerto 3000 ocupado | `PORT=8080 npm start` o cambia el mapeo en `docker-compose.yml` |
| Fotos no visibles tras restaurar un respaldo | Copia también la carpeta `public/uploads/` |
| `npm run db:seed` duplicó productos | Elimina los duplicados desde el panel de administración; el seed es solo para bases vacías |

---

¿Dudas con la instalación? Todo el flujo (catálogo, carrito, WhatsApp, admin) funciona igual que en la vista previa que ya probaste.
