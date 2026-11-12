import 'dotenv/config' // carga .env para poder ejecutarlo con: npx tsx prisma/seed-admin.ts
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const db = new PrismaClient()

const USERNAME = admin
const PASSWORD = pixel3d2025

async function main() {
  const salt = crypto.randomBytes(16).toString('hex')
  const passwordHash = crypto.scryptSync(PASSWORD, salt, 64).toString('hex')

  const existing = await db.adminUser.findUnique({ where: { username: USERNAME } })
  if (existing) {
    await db.adminUser.update({
      where: { username: USERNAME },
      data: { passwordHash, salt },
    })
    console.log(`Usuario admin actualizado (${USERNAME}).`)
  } else {
    await db.adminUser.create({
      data: { username: USERNAME, passwordHash, salt },
    })
    console.log(`Usuario admin creado (${USERNAME}).`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
