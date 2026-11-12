import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  createToken,
  sessionCookieOptions,
  verifyCredentials,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = String(body?.username ?? '').trim()
    const password = String(body?.password ?? '')

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Ingresa usuario y contraseña' },
        { status: 400 }
      )
    }

    const valid = await verifyCredentials(username, password)
    if (!valid) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const res = NextResponse.json({ authenticated: true, username })
    res.cookies.set(ADMIN_COOKIE, createToken(username), sessionCookieOptions())
    return res
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'No se pudo iniciar sesión' },
      { status: 500 }
    )
  }
}
