import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth'

const MAX_FILE_SIZE = 30 * 1024 * 1024

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // La autenticación se exige al generar el token. El callback de
        // finalización de Vercel no lleva la cookie del administrador.
        if (!getAdmin(request)) throw new Error('No autorizado')
        return {
        allowedContentTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/quicktime',
        ],
        maximumSizeInBytes: MAX_FILE_SIZE,
        addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.info('Archivo guardado en Vercel Blob:', blob.pathname)
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en carga a Vercel Blob:', error)
    return NextResponse.json({ error: 'No se pudo cargar el archivo' }, { status: 400 })
  }
}
