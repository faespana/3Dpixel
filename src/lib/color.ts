import {
  MAX_COLORS_PER_PRODUCT,
  type ProductColor,
} from '@/lib/types'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSV {
  /** Matiz 0-360. */
  h: number
  /** Saturación 0-1. */
  s: number
  /** Valor (brillo) 0-1. */
  v: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const HEX_RE = /^#?[0-9a-fA-F]{6}$/

/** Indica si un texto es un color hexadecimal válido de 6 dígitos. */
export function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex.trim())
}

/** Normaliza un hex a `#rrggbb` (minúsculas, con #). Devuelve null si es inválido. */
export function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim()
  if (!isValidHex(trimmed)) return null
  return `#${trimmed.replace('#', '').toLowerCase()}`
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex) ?? '#000000'
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to2 = (n: number) =>
    Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6
    } else if (max === gn) {
      h = (bn - rn) / delta + 2
    } else {
      h = (rn - gn) / delta + 4
    }
    h *= 60
    if (h < 0) h += 360
  }

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const hh = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = v - c

  let rn = 0
  let gn = 0
  let bn = 0
  if (hh < 60) [rn, gn, bn] = [c, x, 0]
  else if (hh < 120) [rn, gn, bn] = [x, c, 0]
  else if (hh < 180) [rn, gn, bn] = [0, c, x]
  else if (hh < 240) [rn, gn, bn] = [0, x, c]
  else if (hh < 300) [rn, gn, bn] = [x, 0, c]
  else [rn, gn, bn] = [c, 0, x]

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  }
}

export function hexToHsv(hex: string): HSV {
  return rgbToHsv(hexToRgb(hex))
}

export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv))
}

/**
 * Parsea el campo `colors` (cadena JSON) de la base de datos a una lista
 * segura de colores. Devuelve [] si está vacío, corrupto o inválido.
 */
export function parseColorsField(raw: string | null | undefined): ProductColor[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const colors: ProductColor[] = []
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue
      const record = item as Record<string, unknown>
      const hex = normalizeHex(String(record.hex ?? ''))
      if (!hex) continue
      colors.push({
        name: String(record.name ?? '').trim().slice(0, 30) || hex.toUpperCase(),
        hex,
      })
      if (colors.length >= MAX_COLORS_PER_PRODUCT) break
    }
    return colors
  } catch {
    return []
  }
}

/**
 * Valida la entrada de colores del formulario (JSON en FormData).
 * Devuelve la lista saneada o un mensaje de error para el cliente.
 */
export function parseColorsInput(
  raw: FormDataEntryValue | null
): { colors: ProductColor[] } | { error: string } {
  if (raw === null || String(raw).trim() === '') {
    return { colors: [] }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    return { error: 'La lista de colores no es válida' }
  }
  if (!Array.isArray(parsed)) {
    return { error: 'La lista de colores no es válida' }
  }
  if (parsed.length > MAX_COLORS_PER_PRODUCT) {
    return { error: `Máximo ${MAX_COLORS_PER_PRODUCT} colores por producto` }
  }

  const colors: ProductColor[] = []
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) {
      return { error: 'La lista de colores no es válida' }
    }
    const record = item as Record<string, unknown>
    const hex = normalizeHex(String(record.hex ?? ''))
    if (!hex) {
      return { error: 'Hay un color con un formato hexadecimal inválido' }
    }
    const name =
      String(record.name ?? '')
        .trim()
        .slice(0, 30) || hex.toUpperCase()
    colors.push({ name, hex })
  }
  return { colors }
}
