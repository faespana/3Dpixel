import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Gestión de archivos subidos por el administrador (fotos y videos cortos).
 *
 * Las fotos se guardan en `public/uploads` normalizadas (webp, máx. 1200px,
 * orientación EXIF corregida) y los videos tal cual (MP4/WEBM/MOV).
 * Se sirven a través de `/api/uploads/[file]`, que lee el archivo del disco
 * en cada petición. Así los archivos nuevos siempre se muestran, sin depender
 * de la caché de archivos estáticos ni del optimizador de next/image.
 */

export const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

export const VALID_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov (iPhone)
]
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024 // 30MB

const FILENAME_RE = /^[A-Za-z0-9._-]+$/

export type MediaType = 'image' | 'video'

export class UploadError extends Error {
  constructor(
    public code:
      | 'INVALID_TYPE'
      | 'FILE_TOO_LARGE'
      | 'INVALID_IMAGE'
      | 'INVALID_VIDEO'
  ) {
    super(code)
  }
}

/** Detecta el tipo de medio según el MIME type (o null si no es válido). */
export function mediaTypeOfFile(file: File): MediaType | null {
  if (VALID_IMAGE_TYPES.includes(file.type)) return 'image'
  if (VALID_VIDEO_TYPES.includes(file.type)) return 'video'
  return null
}

/** Extensión de archivo para un tipo MIME de video permitido. */
function videoExtension(type: string): string {
  switch (type) {
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    default:
      return 'mov'
  }
}

/**
 * Guarda un archivo (foto o video corto) y devuelve su ruta pública
 * `/api/uploads/...` junto con el tipo de medio detectado.
 */
export async function saveUploadedMedia(
  file: File
): Promise<{ url: string; type: MediaType }> {
  const type = mediaTypeOfFile(file)
  if (!type) {
    throw new UploadError('INVALID_TYPE')
  }

  const maxBytes = type === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  if (file.size > maxBytes) {
    throw new UploadError('FILE_TOO_LARGE')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true })

  if (type === 'video') {
    // Los videos se guardan tal cual; `sharp` no procesa video.
    const filename = `${base}.${videoExtension(file.type)}`
    try {
      await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), buffer)
      return { url: `/api/uploads/${filename}`, type }
    } catch {
      throw new UploadError('INVALID_VIDEO')
    }
  }

  try {
    // Los GIF se guardan tal cual para conservar la animación
    if (file.type === 'image/gif') {
      const filename = `${base}.gif`
      await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), buffer)
      return { url: `/api/uploads/${filename}`, type }
    }

    const filename = `${base}.webp`
    await sharp(buffer)
      .rotate() // corrige la orientación según el EXIF
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(UPLOADS_DIR, filename))
    return { url: `/api/uploads/${filename}`, type }
  } catch {
    throw new UploadError('INVALID_IMAGE')
  }
}

/** Nombre de archivo contenido en una ruta de uploads (o null si no lo es). */
export function uploadedFilenameFromPath(filePath: string): string | null {
  const prefixes = ['/api/uploads/', '/uploads/']
  for (const prefix of prefixes) {
    if (filePath.startsWith(prefix)) {
      const name = filePath.slice(prefix.length)
      if (FILENAME_RE.test(name) && !name.includes('..')) return name
    }
  }
  return null
}

/** Elimina del disco un archivo subido anteriormente (si aplica). */
export async function removeUploadedFile(filePath: string): Promise<void> {
  const name = uploadedFilenameFromPath(filePath)
  if (!name) return
  await fs.promises.unlink(path.join(UPLOADS_DIR, name)).catch(() => {})
}

/** @deprecated Usa removeUploadedFile (mismo comportamiento). */
export const removeUploadedImage = removeUploadedFile

/** @deprecated Usa saveUploadedMedia (mismo comportamiento para fotos). */
export async function saveUploadedImage(file: File): Promise<string> {
  const { url } = await saveUploadedMedia(file)
  return url
}
