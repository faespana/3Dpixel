/** Claves de los precios por cantidad opcionales de un producto. */
export type TierPriceKey =
  | 'priceDozen'
  | 'priceTwoDozen'
  | 'priceThreeDozen'
  | 'priceBulk'

/** Tipo de medio en la galería de un producto. */
export type MediaKind = 'image' | 'video'

export interface ProductMedia {
  id: string
  url: string
  type: MediaKind
  order: number
}

/** Un color de la paleta de un producto. */
export interface ProductColor {
  /** Nombre mostrado bajo la muestra (ej: "Negro"). */
  name: string
  /** Color en formato hexadecimal `#rrggbb`. */
  hex: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  priceDozen: number | null
  priceTwoDozen: number | null
  priceThreeDozen: number | null
  priceBulk: number | null
  category: string
  image: string
  featured: boolean
  createdAt: string
  /** Galería de fotos y videos del producto (ordenada). */
  media: ProductMedia[]
  /** Paleta de colores disponible del producto. */
  colors: ProductColor[]
}

/** Límite de archivos (fotos + videos) por producto. */
export const MAX_MEDIA_PER_PRODUCT = 8

/** Límite de colores en la paleta de un producto. */
export const MAX_COLORS_PER_PRODUCT = 12

export type CategoryId = 'todos' | 'tomatodos' | 'jarros' | 'otros'

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'tomatodos', label: 'Tomatodos' },
  { id: 'jarros', label: 'Jarros' },
  { id: 'otros', label: 'Otros' },
]

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? 'Producto'
}

/** Claves de los niveles de precio por cantidad, en orden de escala. */
export const TIER_PRICE_KEYS: TierPriceKey[] = [
  'priceDozen',
  'priceTwoDozen',
  'priceThreeDozen',
  'priceBulk',
]

/** Identifica imágenes alojadas fuera del directorio estático de Next.js. */
export function isUploadedImage(src: string): boolean {
  return src.startsWith('https://') || src.startsWith('/api/uploads/')
}
