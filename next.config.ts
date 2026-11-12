import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* La tienda usa el modo estándar de Next.js: `npm run build` + `npm start`.
     Las fotos y videos que sube el administrador se guardan en `public/uploads`
     y se sirven por `/api/uploads/[file]`, por lo que funcionan igual en
     desarrollo y en producción. */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
