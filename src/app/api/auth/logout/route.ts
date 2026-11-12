import { NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ authenticated: false })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
