/**
 * Precios por cantidad (mayorista).
 *
 * Escalas:
 *  - 1 a 11 unidades: precio normal (`price`)
 *  - 12 a 23 (1 docena): `priceDozen`
 *  - 24 a 35 (2 docenas): `priceTwoDozen`
 *  - 36 a 47 (3 docenas): `priceThreeDozen`
 *  - 48 o más (más de 3 docenas): `priceBulk`
 *
 * Si un nivel intermedio no tiene precio definido, se usa el último
 * nivel inferior disponible; si ninguno, el precio normal.
 */
import type { Product, TierPriceKey } from '@/lib/types'

export interface PriceTier {
  key: 'base' | TierPriceKey
  min: number
  max: number | null
  /** Etiqueta corta del rango, ej. "12-23" o "48+". */
  rangeLabel: string
  /** Etiqueta descriptiva para el panel admin. */
  adminLabel: string
  price: number
}

interface TierDef {
  key: TierPriceKey
  min: number
  max: number | null
  rangeLabel: string
  adminLabel: string
}

export const TIER_DEFS: TierDef[] = [
  {
    key: 'priceDozen',
    min: 12,
    max: 23,
    rangeLabel: '12-23',
    adminLabel: '1 docena (12-23 und)',
  },
  {
    key: 'priceTwoDozen',
    min: 24,
    max: 35,
    rangeLabel: '24-35',
    adminLabel: '2 docenas (24-35 und)',
  },
  {
    key: 'priceThreeDozen',
    min: 36,
    max: 47,
    rangeLabel: '36-47',
    adminLabel: '3 docenas (36-47 und)',
  },
  {
    key: 'priceBulk',
    min: 48,
    max: null,
    rangeLabel: '48+',
    adminLabel: 'Más de 3 docenas (48+ und)',
  },
]

type TierPriced = Pick<
  Product,
  'price' | 'priceDozen' | 'priceTwoDozen' | 'priceThreeDozen' | 'priceBulk'
>

/** Lista de niveles de precio activos de un producto (base primero). */
export function getPriceTiers(product: TierPriced): PriceTier[] {
  const tiers: PriceTier[] = [
    {
      key: 'base',
      min: 1,
      max: 11,
      rangeLabel: '1-11',
      adminLabel: '1-11 und',
      price: product.price,
    },
  ]
  for (const def of TIER_DEFS) {
    const value = product[def.key]
    if (typeof value === 'number' && value > 0) {
      tiers.push({ ...def, price: value })
    }
  }
  return tiers
}

/** Precio unitario aplicable según la cantidad en el carrito. */
export function getUnitPrice(
  product: TierPriced,
  quantity: number
): number {
  let unit = product.price
  for (const def of TIER_DEFS) {
    if (quantity >= def.min) {
      const value = product[def.key]
      if (typeof value === 'number' && value > 0) unit = value
    }
  }
  return unit
}

export interface NextTierHint {
  /** Cuántas unidades faltan para alcanzar el siguiente nivel. */
  addMore: number
  /** Cantidad mínima del siguiente nivel. */
  min: number
  /** Precio unitario del siguiente nivel. */
  price: number
}

/** Siguiente nivel de descuento alcanzable (o null si ya está en el mejor). */
export function getNextTierHint(
  product: TierPriced,
  quantity: number
): NextTierHint | null {
  for (const def of TIER_DEFS) {
    if (quantity < def.min) {
      const value = product[def.key]
      if (typeof value === 'number' && value > 0) {
        return { addMore: def.min - quantity, min: def.min, price: value }
      }
    }
  }
  return null
}

/**
 * Valida el valor enviado desde el formulario para un nivel de precio.
 * Devuelve el número (o null si se envió vacío) o un mensaje de error.
 */
export function validateTierValue(
  raw: string,
  key: TierPriceKey,
  basePrice: number
): { value: number | null; error?: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { value: null }

  const value = Number(trimmed)
  const label = TIER_DEFS.find((d) => d.key === key)?.adminLabel ?? key
  if (!Number.isFinite(value) || value <= 0) {
    return { value: null, error: `Ingresa un precio válido para ${label}` }
  }
  if (value >= basePrice) {
    return {
      value: null,
      error: `El precio para ${label} debe ser menor al precio normal (1-11 und)`,
    }
  }
  return { value }
}
