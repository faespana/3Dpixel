import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { validateTierValue } from '@/lib/pricing'
import { removeUploadedFile } from '@/lib/uploads'
import { parseColorsField, parseColorsInput } from '@/lib/color'
import { TIER_PRICE_KEYS, type TierPriceKey } from '@/lib/types'
import { MAX_MEDIA_PER_PRODUCT } from '@/lib/types'

const VALID_CATEGORIES = ['tomatodos', 'jarros', 'otros']

const MEDIA_INCLUDE = {
  media: {
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
  },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const category = searchParams.get('category')?.trim() ?? ''

    const where: Record<string, unknown> = {}

    if (category && category !== 'todos') {
      where.category = category
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { category: { contains: q } },
      ]
    }

    const products = await db.product.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }],
      include: MEDIA_INCLUDE,
    })

    // Parsea la paleta de colores (JSON en la BD) a una lista segura
    return NextResponse.json(
      products.map((p) => ({ ...p, colors: parseColorsField(p.colors) }))
    )
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'No se pudieron cargar los productos' },
      { status: 500 }
    )
  }
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

export async function POST(req: NextRequest) {
  const admin = getAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const name = String(form.get('name') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    const price = Number(form.get('price'))
    const category = String(form.get('category') ?? '').trim()
    const featured = String(form.get('featured') ?? 'false') === 'true'

    if (!name || !description) {
      return NextResponse.json(
        { error: 'El nombre y la descripción son obligatorios' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Ingresa un precio válido mayor a 0' },
        { status: 400 }
      )
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Categoría no válida' },
        { status: 400 }
      )
    }

    // Precios por cantidad (opcionales; cadena vacía = sin precio)
    const tierData: Record<TierPriceKey, number | null> = {
      priceDozen: null,
      priceTwoDozen: null,
      priceThreeDozen: null,
      priceBulk: null,
    }
    for (const key of TIER_PRICE_KEYS) {
      const { value, error } = validateTierValue(
        String(form.get(key) ?? ''),
        key,
        price
      )
      if (error) {
        return NextResponse.json({ error }, { status: 400 })
      }
      tierData[key] = value
    }

    // Paleta de colores (JSON del formulario)
    const colorsParsed = parseColorsInput(form.get('colors'))
    if ('error' in colorsParsed) {
      return NextResponse.json({ error: colorsParsed.error }, { status: 400 })
    }

    const savedMedia = readMediaItems(form.get('mediaItems'))
    if (!savedMedia || savedMedia.length === 0) {
      return NextResponse.json(
        { error: 'Debes subir al menos una foto del producto' },
        { status: 400 }
      )
    }
    if (savedMedia.length > MAX_MEDIA_PER_PRODUCT) {
      return NextResponse.json(
        { error: `Máximo ${MAX_MEDIA_PER_PRODUCT} fotos/videos por producto` },
        { status: 400 }
      )
    }

    // Debe existir al menos una foto para la portada
    const firstImage = savedMedia.find((m) => m.type === 'image')
    if (!firstImage) {
      await Promise.all(savedMedia.map((m) => removeUploadedFile(m.url)))
      return NextResponse.json(
        { error: 'Debes subir al menos una foto (los videos son adicionales)' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        price,
        priceDozen: tierData.priceDozen,
        priceTwoDozen: tierData.priceTwoDozen,
        priceThreeDozen: tierData.priceThreeDozen,
        priceBulk: tierData.priceBulk,
        category,
        image: firstImage.url,
        featured,
        colors: JSON.stringify(colorsParsed.colors),
        media: {
          create: savedMedia.map((m, index) => ({
            url: m.url,
            type: m.type,
            order: index,
          })),
        },
      },
      include: MEDIA_INCLUDE,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'No se pudo crear el producto' },
      { status: 500 }
    )
  }
}
