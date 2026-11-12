
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      error: 'Este endpoint ya no sirve archivos locales. Utiliza las URL públicas de Vercel Blob.',
    },
    { status: 410 }
  )
}
