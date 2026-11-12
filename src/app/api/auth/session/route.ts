import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = getAdmin(req)
  return NextResponse.json({
    authenticated: Boolean(admin),
    username: admin,
  })
}
