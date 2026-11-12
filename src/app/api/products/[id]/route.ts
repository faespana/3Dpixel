import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { validateTierValue } from '@/lib/pricing'
import { removeUploadedFile } from '@/lib/uploads'
import { parseColorsInput } from '@/lib/color'
import { TIER_PRICE_KEYS, MAX_MEDIA_PER_PRODUCT, type TierPriceKey } from '@/lib/types'

const VALID_CATEGORIES = ['tomatodos', 'jarros', 'otros']

type RouteContext = { params: Promise<{ id: string }> }

const MEDIA_INCLUDE = {
  media: {
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
  },
}

type UploadedMedia = { url: string; type: 'image' | 'video' }

function readMediaItems(value: FormDataEntryValue | null): UploadedMedia[] | null {
  try {
    const parsed = JSON.parse(String(value ?? '[]'))
    if (!Array.isArray(parsed)) return null
    const items = parsed as UploadedMedia[]
    if (items.some((item) =>
      !item || typeof item.url !== 'string' ||
      !item.url.startsWith('https://') ||
      !item.url.includes('.public.blob.vercel-storage.com/') ||
      !['image', 'video'].includes(item.type)
    )) return null
    return items
  } catch {
    return null
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const admin = getAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const existing = await db.product.findUnique({
      where: { id },
      include: MEDIA_INCLUDE,
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    const form = await req.formData()
    const data: Record<string, string | number | boolean> = {}

    if (form.has('name')) {
      const name = String(form.get('name') ?? '').trim()
      if (!name) {
        return NextResponse.json(
          { error: 'El nombre no puede estar vacío' },
          { status: 400 }
        )
      }
      data.name = name
    }

    if (form.has('description')) {
      const description = String(form.get('description') ?? '').trim()
      if (!description) {
        return NextResponse.json(
          { error: 'La descripción no puede estar vacía' },
          { status: 400 }
        )
      }
      data.description = description
    }

    if (form.has('price')) {
      const price = Number(form.get('price'))
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { error: 'Ingresa un precio válido mayor a 0' },
          { status: 400 }
        )
      }
      data.price = price
    }

    // Precios por cantidad: cadena vacía = quitar el precio del nivel
    const basePriceForTiers =
      typeof data.price === 'number' ? data.price : existing.price
    for (const key of TIER_PRICE_KEYS) {
      if (!form.has(key)) continue
      const { value, error } = validateTierValue(
        String(form.get(key) ?? ''),
        key,
        basePriceForTiers
      )
      if (error) {
        return NextResponse.json({ error }, { status: 400 })
      }
      data[key as TierPriceKey] = value as number | null
    }

    if (form.has('category')) {
      const category = String(form.get('category') ?? '').trim()
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: 'Categoría no válida' },
          { status: 400 }
        )
      }
      data.category = category
    }

    if (form.has('featured')) {
      data.featured = String(form.get('featured')) === 'true'
    }

    // Paleta de colores: lista JSON (puede ser vacía para borrarla)
    if (form.has('colors')) {
      const colorsParsed = parseColorsInput(form.get('colors'))
      if ('error' in colorsParsed) {
        return NextResponse.json({ error: colorsParsed.error }, { status: 400 })
      }
      data.colors = JSON.stringify(colorsParsed.colors)
    }

    // ============ Galería (fotos y videos) ============
    const newFiles = readMediaItems(form.get('mediaItems'))
    if (!newFiles) {
      return NextResponse.json({ error: 'La lista de archivos no es válida' }, { status: 400 })
    }

    let keptIds: string[] | null = null
    if (form.has('keepMedia')) {
      try {
        const parsed: unknown = JSON.parse(String(form.get('keepMedia')))
        keptIds = Array.isArray(parsed) ? parsed.map(String) : []
      } catch {
        keptIds = []
      }
    }

    if (keptIds !== null || newFiles.length > 0) {
      const currentMedia = [...existing.media].sort(
        (a, b) => a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime()
      )
      const keptRows = keptIds === null
        ? currentMedia
        : keptIds.map((mid) => currentMedia.find((m) => m.id === mid))
            .filter((m): m is NonNullable<typeof m> => Boolean(m))

      if (keptRows.length + newFiles.length > MAX_MEDIA_PER_PRODUCT) {
        return NextResponse.json(
          { error: `Máximo ${MAX_MEDIA_PER_PRODUCT} fotos/videos por producto` },
          { status: 400 }
        )
      }

      const finalItems = [
        ...keptRows.map((m) => ({ url: m.url, type: m.type })),
        ...newFiles,
      ]

      // Debe quedar al menos una foto para la portada
      if (!finalItems.some((m) => m.type === 'image')) {
        await Promise.all(newFiles.map((m) => removeUploadedFile(m.url)))
        return NextResponse.json(
          { error: 'El producto debe conservar al menos una foto' },
          { status: 400 }
        )
      }

      // Reemplaza la galería completa (orden = portada primero)
      await db.productMedia.deleteMany({ where: { productId: id } })
      await db.productMedia.createMany({
        data: finalItems.map((m, index) => ({
          productId: id,
          url: m.url,
          type: m.type,
          order: index,
        })),
      })

      // Borra del disco lo que ya no forma parte de la galería
      const finalUrls = new Set(finalItems.map((m) => m.url))
      const removedUrls = currentMedia
        .map((m) => m.url)
        .filter((url) => !finalUrls.has(url))
      await Promise.all(removedUrls.map((url) => removeUploadedFile(url)))

      // Actualiza la portada (primera foto de la galería)
      const firstImage = finalItems.find((m) => m.type === 'image')
      if (firstImage && firstImage.url !== existing.image) {
        data.image = firstImage.url
        // Libera la portada anterior si ya no está en la galería
        if (!finalUrls.has(existing.image)) {
          await removeUploadedFile(existing.image)
        }
      }
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: MEDIA_INCLUDE,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json(
      { error: 'No se pudo actualizar el producto' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const admin = getAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const existing = await db.product.findUnique({
      where: { id },
      include: MEDIA_INCLUDE,
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    await db.product.delete({ where: { id } })
    const urls = [existing.image, ...existing.media.map((m) => m.url)]
    await Promise.all(urls.map((url) => removeUploadedFile(url)))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar el producto' },
      { status: 500 }
    )
  }
}
