import fs from 'fs'
import path from 'path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { UPLOADS_DIR, uploadedFilenameFromPath } from '@/lib/uploads'

/**
 * Sirve las imágenes y videos subidos por el administrador.
 * Lee el archivo del disco en cada petición, por lo que los archivos nuevos
 * están disponibles de inmediato sin reiniciar el servidor.
 * Soporta peticiones Range para que los videos puedan reproducirse/avanzar.
 */
export const dynamic = 'force-dynamic'

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

type RouteContext = { params: Promise<{ file: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  const { file } = await context.params
  const name = uploadedFilenameFromPath(`/api/uploads/${file}`)
  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME_BY_EXT[ext]

  if (!name || !contentType) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = path.join(UPLOADS_DIR, name)

  let stat: fs.Stats
  try {
    stat = await fs.promises.stat(filePath)
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }

  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  }

  // Soporte de Range (reproducción y avance de videos)
  const range = req.headers.get('range')
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range)
    if (match) {
      const start = match[1] ? Number(match[1]) : 0
      const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1

      if (Number.isFinite(start) && start <= end && start < stat.size) {
        const chunk = await fs.promises.readFile(filePath)
        const body = chunk.subarray(start, end + 1)
        return new NextResponse(new Uint8Array(body), {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Content-Length': String(end - start + 1),
          },
        })
      }

      return new NextResponse('Range Not Satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${stat.size}`,
        },
      })
    }
  }

  try {
    const data = await fs.promises.readFile(filePath)
    return new NextResponse(new Uint8Array(data), {
      headers: {
        ...baseHeaders,
        'Content-Length': String(stat.size),
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
