'use client'

import { useState } from 'react'
import { Palette, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorPickerDialog } from '@/components/store/color-picker-dialog'
import {
  clamp,
  hexToRgb,
  normalizeHex,
  rgbToHex,
} from '@/lib/color'
import { MAX_COLORS_PER_PRODUCT, type ProductColor } from '@/lib/types'

interface ColorPaletteEditorProps {
  colors: ProductColor[]
  onChange: (colors: ProductColor[]) => void
  disabled?: boolean
}

/** Colores sugeridos al agregar una fila nueva (rota si ya están usados). */
const DEFAULT_HEXES = [
  '#1c1c1c',
  '#f5f5f5',
  '#c2c2c2',
  '#7a9b76',
  '#e39cb5',
  '#a8d8ea',
  '#c0392b',
  '#efe6d8',
]

function nextDefaultHex(colors: ProductColor[]): string {
  const used = new Set(colors.map((c) => c.hex.toLowerCase()))
  return DEFAULT_HEXES.find((hex) => !used.has(hex)) ?? '#1c1c1c'
}

/** Indica si una fila es blanca (para mostrar el borde oscuro). */
function isLightHex(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}

interface ColorRowProps {
  color: ProductColor
  disabled?: boolean
  onPatch: (patch: Partial<ProductColor>) => void
  onRemove: () => void
  onOpenPicker: () => void
}

/** Fila editable de un color: muestra, nombre, HEX y canales RGB. */
function ColorRow({ color, disabled, onPatch, onRemove, onOpenPicker }: ColorRowProps) {
  const [hexText, setHexText] = useState(color.hex)
  const [prevHex, setPrevHex] = useState(color.hex)
  const rgb = hexToRgb(color.hex)

  // Sincroniza el texto cuando el color cambia desde el selector
  // (ajuste de estado durante el render, patrón recomendado por React)
  if (color.hex !== prevHex) {
    setPrevHex(color.hex)
    setHexText(color.hex)
  }

  const commitHex = (text: string) => {
    setHexText(text)
    const normalized = normalizeHex(text)
    if (normalized) {
      onPatch({ hex: normalized })
    }
  }

  const updateChannel = (channel: 'r' | 'g' | 'b', raw: string) => {
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    const next = rgbToHex({
      ...rgb,
      [channel]: clamp(Math.round(num), 0, 255),
    })
    setHexText(next)
    onPatch({ hex: next })
  }

  return (
    <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-2">
      {/* Muestra + nombre + quitar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPicker}
          disabled={disabled}
          aria-label={`Abrir selector de color para ${color.name || 'este color'}`}
          title="Abrir selector de color"
          className="h-9 w-9 shrink-0 rounded-full border shadow-sm transition hover:scale-105 disabled:opacity-50"
          style={{
            backgroundColor: color.hex,
            borderColor: isLightHex(color.hex) ? '#d6d3d1' : color.hex,
          }}
        />
        <Input
          value={color.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="Nombre (ej: Negro)"
          maxLength={30}
          disabled={disabled}
          aria-label="Nombre del color"
          className="h-9 flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Quitar color ${color.name || 'de la paleta'}`}
          className="h-8 w-8 shrink-0 text-stone-400 hover:bg-red-50 hover:text-red-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* HEX + RGB */}
      <div className="flex items-end gap-1.5">
        <div className="min-w-0">
          <label
            htmlFor={`color-hex-${color.hex}`}
            className="text-[10px] font-semibold uppercase tracking-wide text-stone-400"
          >
            Hex
          </label>
          <div className="flex h-8 items-center rounded-md border border-stone-200 bg-white px-2 focus-within:ring-2 focus-within:ring-ring">
            <span className="text-[11px] text-stone-400">#</span>
            <input
              id={`color-hex-${color.hex}`}
              value={hexText.replace('#', '').toUpperCase()}
              onChange={(e) => commitHex(`#${e.target.value.replace('#', '')}`)}
              onBlur={() => setHexText(color.hex)}
              maxLength={6}
              spellCheck={false}
              disabled={disabled}
              className="w-[72px] bg-transparent font-mono text-[11px] uppercase outline-none"
              aria-label="Color en hexadecimal"
            />
          </div>
        </div>
        {(['r', 'g', 'b'] as const).map((channel) => (
          <div key={channel} className="min-w-0 flex-1">
            <label
              htmlFor={`color-${channel}-${color.hex}`}
              className="text-[10px] font-semibold uppercase tracking-wide text-stone-400"
            >
              {channel.toUpperCase()}
            </label>
            <Input
              id={`color-${channel}-${color.hex}`}
              type="number"
              min={0}
              max={255}
              value={rgb[channel]}
              onChange={(e) => updateChannel(channel, e.target.value)}
              disabled={disabled}
              className="h-8 px-1.5 text-[11px]"
              aria-label={`Canal ${channel.toUpperCase()} del color`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Sección de edición de la paleta de colores de un producto:
 * permite escoger la cantidad de colores y definirlos por nombre,
 * HEX, RGB o arrastrando el cursor en el selector.
 */
export function ColorPaletteEditor({
  colors,
  onChange,
  disabled = false,
}: ColorPaletteEditorProps) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const atLimit = colors.length >= MAX_COLORS_PER_PRODUCT

  const patchColor = (index: number, patch: Partial<ProductColor>) => {
    onChange(colors.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index))
    if (pickerIndex === index) setPickerIndex(null)
  }

  const addColor = () => {
    if (atLimit) return
    onChange([...colors, { name: '', hex: nextDefaultHex(colors) }])
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Palette className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-800">
            Colores disponibles
            <span className="ml-1.5 font-normal text-stone-400">
              ({colors.length}/{MAX_COLORS_PER_PRODUCT})
            </span>
          </p>
          <p className="text-[11px] leading-tight text-stone-500">
            Escoge cuántos colores tendrá el producto. Puedes elegirlos por HEX,
            RGB o arrastrando el cursor en el selector.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addColor}
          disabled={disabled || atLimit}
          className="h-8 shrink-0 rounded-full border-stone-300 bg-white text-xs"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Agregar
        </Button>
      </div>

      {colors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 bg-white/60 px-3 py-3 text-center text-xs text-stone-500">
          Sin colores. Presiona &quot;Agregar&quot; para definir la paleta que se
          mostrará en el producto.
        </p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {colors.map((color, index) => (
            <ColorRow
              key={index}
              color={color}
              disabled={disabled}
              onPatch={(patch) => patchColor(index, patch)}
              onRemove={() => removeColor(index)}
              onOpenPicker={() => setPickerIndex(index)}
            />
          ))}
        </div>
      )}

      {atLimit && (
        <p className="text-[11px] text-stone-500">
          Alcanzaste el máximo de {MAX_COLORS_PER_PRODUCT} colores por producto.
        </p>
      )}

      <ColorPickerDialog
        open={pickerIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPickerIndex(null)
        }}
        value={pickerIndex !== null ? colors[pickerIndex].hex : '#000000'}
        onApply={(hex) => {
          if (pickerIndex !== null) patchColor(pickerIndex, { hex })
        }}
      />
    </div>
  )
}
