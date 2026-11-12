import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const ADMIN_COOKIE = 'pixel_admin'

const SECRET = process.env.AUTH_SECRET ?? '3dpixel-store-secret-v1'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 días

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
}

/** Crea un token firmado con expiración para la sesión de administrador. */
export function createToken(username: string): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000
  const payload = Buffer.from(`${username}|${exp}`).toString('base64url')
  return `${payload}.${sign(payload)}`
}

/** Verifica el token firmado y devuelve el usuario si es válido. */
export function verifyToken(token: string | undefined | null): string | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  const [username, expRaw] = Buffer.from(payload, 'base64url')
    .toString('utf8')
    .split('|')
  const exp = Number(expRaw)
  if (!username || !Number.isFinite(exp) || exp < Date.now()) return null

  return username
}

/** Obtiene el usuario administrador desde la cookie de la petición. */
export function getAdmin(req: NextRequest): string | null {
  return verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  }
}

/** Valida credenciales contra la base de datos (scrypt + salt). */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const user = await db.adminUser.findUnique({ where: { username } })
  if (!user) return false

  const hash = crypto.scryptSync(password, user.salt, 64).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(user.passwordHash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
