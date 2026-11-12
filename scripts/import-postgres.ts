import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

type Row = Record<string, unknown> & { id: string; createdAt: string | number }
const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'migration/migration-data.json'), 'utf8')) as {
  product: Row[]
  productMedia: Row[]
  adminUser: Row[]
}
const db = new PrismaClient()

// La exportación SQLite guarda createdAt como milisegundos en texto.
// Aceptamos tanto ese formato como fechas ISO para que la migración sea robusta.
function toDate(value: unknown, label: string): Date {
  let date: Date
  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.trim()))) {
    date = new Date(Number(value))
  } else {
    date = new Date(String(value ?? ''))
  }
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Fecha inválida en ${label}: ${String(value)}`)
  }
  return date
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }
  return Boolean(value)
}

async function main() {
  console.log(`Importando ${data.product.length} productos, ${data.productMedia.length} archivos multimedia y ${data.adminUser.length} administrador(es)...`)

  for (const p of data.product) {
    const product = {
      ...p,
      featured: toBoolean(p.featured),
      createdAt: toDate(p.createdAt, `producto ${p.id}`),
    }
    await db.product.upsert({
      where: { id: p.id },
      create: product as never,
      update: product as never,
    })
  }

  for (const m of data.productMedia) {
    const media = {
      ...m,
      order: Number(m.order ?? 0),
      createdAt: toDate(m.createdAt, `multimedia ${m.id}`),
    }
    await db.productMedia.upsert({
      where: { id: m.id },
      create: media as never,
      update: media as never,
    })
  }

  for (const a of data.adminUser) {
    const admin = {
      ...a,
      createdAt: toDate(a.createdAt, `administrador ${a.id}`),
    }
    await db.adminUser.upsert({
      where: { id: a.id },
      create: admin as never,
      update: admin as never,
    })
  }

  console.log('Migración completada. No se han regenerado ni cambiado las contraseñas.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(async () => db.$disconnect())
