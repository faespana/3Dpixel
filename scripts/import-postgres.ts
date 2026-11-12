import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

type Row = Record<string, unknown> & { id: string; createdAt: string }
const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'migration/migration-data.json'), 'utf8')) as {
  product: Row[]
  productMedia: Row[]
  adminUser: Row[]
}
const db = new PrismaClient()

async function main() {
  console.log(`Importando ${data.product.length} productos, ${data.productMedia.length} archivos multimedia y ${data.adminUser.length} administrador(es)...`)
  for (const p of data.product) {
    await db.product.upsert({
      where: { id: p.id },
      create: { ...p, createdAt: new Date(p.createdAt) } as never,
      update: { ...p, createdAt: new Date(p.createdAt) } as never,
    })
  }
  for (const m of data.productMedia) {
    await db.productMedia.upsert({
      where: { id: m.id },
      create: { ...m, createdAt: new Date(m.createdAt) } as never,
      update: { ...m, createdAt: new Date(m.createdAt) } as never,
    })
  }
  for (const a of data.adminUser) {
    await db.adminUser.upsert({
      where: { id: a.id },
      create: { ...a, createdAt: new Date(a.createdAt) } as never,
      update: { ...a, createdAt: new Date(a.createdAt) } as never,
    })
  }
  console.log('Migración completada. No se han regenerado ni cambiado las contraseñas.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(async () => db.$disconnect())
