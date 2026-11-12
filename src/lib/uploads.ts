import { del } from '@vercel/blob'

export type MediaType = 'image' | 'video'

/** Borra únicamente archivos alojados en el Blob público de este proyecto.
 * Las imágenes incluidas en /public/images nunca se eliminan.
 */
export async function removeUploadedFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith('https://') || !fileUrl.includes('.public.blob.vercel-storage.com/')) return
  try {
    await del(fileUrl)
  } catch (error) {
    console.error('No se pudo eliminar el archivo de Vercel Blob:', error)
  }
}

export const removeUploadedImage = removeUploadedFile
