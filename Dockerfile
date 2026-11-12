# ---------------------------------------------------------------
# 3D PIXEL - Imagen de producción (Node.js 20 + Next.js + SQLite)
# Uso rápido:
#   docker compose up -d --build     ->  http://localhost:3000
# ---------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1) Instalar dependencias (se cachea mientras no cambies package.json)
COPY package.json ./
RUN npm install

# 2) Copiar el resto del código
COPY . .

# 3) Generar el cliente de Prisma y compilar la aplicación
RUN npx prisma generate && npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
