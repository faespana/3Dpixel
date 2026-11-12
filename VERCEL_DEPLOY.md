# 3D PIXEL — Corrección para Vercel

Esta versión sustituye SQLite por PostgreSQL (Neon) y el almacenamiento local `public/uploads` por Vercel Blob. Conserva Next.js, el diseño, el catálogo, precios por cantidad, paletas, carrito, WhatsApp y autenticación.

## Datos que ya están preparados

`migration/migration-data.json` contiene una copia de migración de la base incluida en el ZIP:
- 10 productos
- 14 registros de galería
- 1 administrador, conservando su hash y salt de contraseña

Las 14 imágenes de la galería inicial siguen siendo archivos estáticos bajo `public/images/products/`; no hace falta subirlas a Blob. Se desplegarán con Next.js.

## 1. Crear los almacenes

En el proyecto `3-dpixel` de Vercel:

1. Abre **Storage** y crea una base PostgreSQL desde Neon (Marketplace). Copia la cadena de conexión pooled que proporciona Neon.
2. En **Storage**, crea un **Blob Store público** y conéctalo a este proyecto. Vercel añadirá `BLOB_READ_WRITE_TOKEN` al entorno.
3. En **Settings → Environment Variables**, configura para Production (y Preview si lo necesitas):
   - `DATABASE_URL`: cadena PostgreSQL pooled de Neon, con SSL (`?sslmode=require&pgbouncer=true`).
   - `AUTH_SECRET`: secreto aleatorio largo. Puedes generarlo con `openssl rand -base64 48`.

No uses `file:../db/custom.db` en Vercel. No borres la base SQLite original: queda como respaldo.

## 2. Importar los 10 productos sin perder el administrador

En tu computadora, abre esta carpeta del proyecto y ejecuta:

```bash
npm install
npx prisma generate
```

Crea `.env` usando las mismas variables `DATABASE_URL` y `AUTH_SECRET` de Vercel. La variable `BLOB_READ_WRITE_TOKEN` no se necesita para importar productos.

Luego ejecuta:

```bash
npx prisma db push
npm run db:import
```

El importador es repetible: usa `upsert` y conserva los IDs, precios, colores, fechas, galerías, hash y salt del administrador. No ejecuta el seed y no vuelve a crear productos de ejemplo.

Comprueba que la importación terminó indicando 10 productos, 14 archivos multimedia y 1 administrador.

## 3. Desplegar el código corregido

Sube esta versión al repositorio Git conectado a Vercel o importa el ZIP actualizado. En Vercel ejecuta un nuevo deployment. El comando de build es:

```bash
npx prisma generate && next build
```

Si Vercel usa `npm run build`, el `postinstall` habitual de Prisma puede generar el cliente; para evitar dudas configura Build Command como `npx prisma generate && npm run build`.

## 4. Probar

1. Abre `https://3-dpixel.vercel.app/api/products`. Debe devolver un arreglo JSON con 10 productos.
2. Abre la tienda: deben aparecer los 10 productos y sus imágenes `/images/products/...`.
3. Inicia sesión con `admin` / `pixel3d2025` (cambia la contraseña después de entrar).
4. Crea un producto de prueba y sube una foto. Debe quedar una URL `https://....public.blob.vercel-storage.com/...`.
5. Edita un producto, guarda y vuelve a cargar la página para comprobar persistencia.

## 5. Importante

- No ejecutes `npm run db:seed` en producción: no es necesario y podría añadir productos duplicados.
- No ejecutes `prisma db push` contra la antigua SQLite; el esquema de esta versión es PostgreSQL.
- Conserva `db/custom.db` y `migration/migration-data.json` como respaldo hasta verificar el sitio nuevo.
- Las imágenes originales permanecen en `public/images`. Los archivos nuevos se guardan en Blob público. Las fotos y videos se suben desde el navegador para evitar el límite de 4.5 MB de las funciones de Vercel.
- Vercel Blob público significa que cualquier persona que tenga la URL puede ver esos archivos; es apropiado para fotos y videos de productos.
