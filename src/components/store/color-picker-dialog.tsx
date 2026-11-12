'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  clamp,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  normalizeHex,
  rgbToHsv,
  type HSV,
} from '@/lib/color'
import { cn } from '@/lib/utils'

interface ColorPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Color inicial (hex `#rrggbb`). */
  value: string
  /** Se ejecuta al presionar "Aceptar" con el color elegido. */
  onApply: (hex: string) => void
}

/** Clip hexagonal estilo Windows (puntas a los lados). */
const HEX_CLIP = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'

/** Filas del panal estándar: cantidad de celdas + saturación + brillo. */
const HONEY_ROWS = [
  { count: 3, s: 0.75, v: 0.45 },
  { count: 6, s: 0.8, v: 0.62 },
  { count: 9, s: 1, v: 1 },
  { count: 9, s: 0.85, v: 1 },
  { count: 6, s: 0.6, v: 1 },
  { count: 3, s: 0.35, v: 1 },
] as const

/** Escala de grises bajo el panal. */
const GRAY_STEPS = [
  '#FFFFFF', '#E8E8E8', '#D1D1D1', '#B9B9B9', '#A1A1A1', '#898989',
  '#717171', '#595959', '#414141', '#282828', '#000000',
] as const

/** Genera el panal de colores estándar (barrido de matiz por fila). */
function buildStandardColors(): { hex: string }[] {
  const cells: { hex: string }[] = []
  for (const row of HONEY_ROWS) {
    for (let j = 0; j < row.count; j++) {
      const h = row.count > 1 ? (j / (row.count - 1)) * 300 : 0
      cells.push({ hex: hsvToHex({ h, s: row.s, v: row.v }) })
    }
  }
  return cells
}

const STANDARD_COLORS = buildStandardColors()

export function ColorPickerDialog({
  open,
  onOpenChange,
  value,
  onApply,
}: ColorPickerDialogProps) {
  const [draftHsv, setDraftHsv] = useState<HSV>({ h: 0, s: 0, v: 0 })
  const [hexText, setHexText] = useState('#000000')
  const [selectedStd, setSelectedStd] = useState<string | null>(null)
  const svDragging = useRef(false)
  const hueDragging = useRef(false)

  const draftHex = hsvToHex(draftHsv)
  const draftRgb = hexToRgb(draftHex)
  const initialHex = normalizeHex(value) ?? '#000000'

  // Al abrir, reinicia el borrador con el color actual
  useEffect(() => {
    if (!open) return
    const hex = normalizeHex(value) ?? '#000000'
    setDraftHsv(hexToHsv(hex))
    setHexText(hex)
    setSelectedStd(hex)
    svDragging.current = false
    hueDragging.current = false
  }, [open, value])

  // Mantiene el campo de texto sincronizado con el borrador
  useEffect(() => {
    setHexText(draftHex)
  }, [draftHex])

  const setDraftFromHex = useCallback((hex: string) => {
    setDraftHsv(hexToHsv(hex))
  }, [])

  const commitHexText = (text: string) => {
    setHexText(text)
    const normalized = normalizeHex(text)
    if (normalized) setDraftFromHex(normalized)
  }

  const updateRgbChannel = (channel: 'r' | 'g' | 'b', raw: string) => {
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    const rgb = { ...hexToRgb(draftHex), [channel]: clamp(Math.round(num), 0, 255) }
    setDraftHsv(rgbToHsv(rgb))
  }

  // ============ Arrastre en el plano saturación/brillo ============
  const handleSvPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const s = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1)
    setDraftHsv((prev) => ({ ...prev, s, v }))
  }

  // ============ Arrastre en la barra de matiz ============
  const handleHuePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const h = clamp((e.clientX - rect.left) / rect.width, 0, 1) * 360
    setDraftHsv((prev) => ({ ...prev, h }))
  }

  const handleAccept = () => {
    onApply(draftHex)
    onOpenChange(false)
  }

  const previewSwatch = (hex: string, label: string) => (
    <div className="min-w-0 flex-1 sm:flex-none sm:w-full">
      <div
        className="h-10 w-full rounded-lg border border-stone-300 shadow-inner"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <p className="mt-1 text-center text-[11px] font-medium text-stone-500">
        {label}
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Colores</DialogTitle>
          <DialogDescription>
            Elige un color de la paleta estándar, arrastra el cursor sobre el
            plano o escribe el valor exacto en HEX o RGB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
          <div className="min-w-0 flex-1">
            <Tabs defaultValue="estandar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="estandar">Estándar</TabsTrigger>
                <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
              </TabsList>

              {/* ===== Pestaña Estándar: panal de colores ===== */}
              <TabsContent value="estandar" className="mt-3">
                <div className="flex flex-col items-center">
                  <div role="group" aria-label="Paleta estándar de colores">
                    {HONEY_ROWS.map((row, rowIndex) => (
                      <div
                        key={`row-${rowIndex}`}
                        className="flex justify-center"
                        style={{
                          marginTop: rowIndex === 0 ? 0 : -7,
                          marginLeft: rowIndex % 2 === 1 ? 15 : 0,
                        }}
                      >
                        {Array.from({ length: row.count }).map((_, j) => {
                          const h =
                            row.count > 1 ? (j / (row.count - 1)) * 300 : 0
                          const hex = hsvToHex({ h, s: row.s, v: row.v })
                          const selected = selectedStd === hex
                          return (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => {
                                setDraftFromHex(hex)
                                setSelectedStd(hex)
                              }}
                              aria-label={`Elegir color ${hex}`}
                              aria-pressed={selected}
                              className={cn(
                                'relative h-[26px] w-[30px] shrink-0 transition-transform',
                                selected
                                  ? 'z-10 scale-110'
                                  : 'hover:z-10 hover:scale-110'
                              )}
                              style={{ clipPath: HEX_CLIP }}
                            >
                              {selected && (
                                <span
                                  aria-hidden="true"
                                  className="absolute -inset-y-0.5 left-0 right-0"
                                  style={{
                                    clipPath: HEX_CLIP,
                                    backgroundColor: '#1c1917',
                                  }}
                                />
                              )}
                              <span
                                aria-hidden="true"
                                className="absolute inset-0"
                                style={{
                                  clipPath: HEX_CLIP,
                                  backgroundColor: hex,
                                  transform: selected ? 'scale(0.92)' : undefined,
                                }}
                              />
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Escala de grises */}
                  <div
                    role="group"
                    aria-label="Escala de grises"
                    className="mt-4 flex flex-wrap justify-center gap-1"
                  >
                    {GRAY_STEPS.map((gray) => (
                      <button
                        key={gray}
                        type="button"
                        onClick={() => {
                          setDraftFromHex(gray)
                          setSelectedStd(gray)
                        }}
                        aria-label={`Elegir gris ${gray}`}
                        aria-pressed={selectedStd === gray}
                        className={cn(
                          'h-6 w-6 rounded-md border transition-transform hover:scale-110',
                          selectedStd === gray
                            ? 'scale-110 border-stone-900 ring-2 ring-stone-800'
                            : 'border-stone-300'
                        )}
                        style={{ backgroundColor: gray }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ===== Pestaña Personalizado: arrastre + HEX + RGB ===== */}
              <TabsContent value="personalizado" className="mt-3 space-y-3">
                {/* Plano saturación / brillo */}
                <div
                  role="slider"
                  aria-label="Plano de saturación y brillo"
                  aria-valuenow={Math.round(draftHsv.s * 100)}
                  tabIndex={0}
                  className="relative h-44 w-full cursor-crosshair touch-none rounded-lg border border-stone-200"
                  style={{
                    background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, hsl(${draftHsv.h} 100% 50%))`,
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    svDragging.current = true
                    handleSvPointer(e)
                  }}
                  onPointerMove={(e) => {
                    if (svDragging.current) handleSvPointer(e)
                  }}
                  onPointerUp={() => {
                    svDragging.current = false
                  }}
                  onPointerCancel={() => {
                    svDragging.current = false
                  }}
                  onKeyDown={(e) => {
                    const step = 0.03
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      const delta = e.key === 'ArrowLeft' ? -step : step
                      setDraftHsv((prev) => ({
                        ...prev,
                        s: clamp(prev.s + delta, 0, 1),
                      }))
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      const delta = e.key === 'ArrowUp' ? step : -step
                      setDraftHsv((prev) => ({
                        ...prev,
                        v: clamp(prev.v + delta, 0, 1),
                      }))
                    }
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                    style={{
                      left: `${draftHsv.s * 100}%`,
                      top: `${(1 - draftHsv.v) * 100}%`,
                      backgroundColor: draftHex,
                      outline: '1px solid rgba(0,0,0,0.35)',
                    }}
                  />
                </div>

                {/* Barra de matiz */}
                <div
                  role="slider"
                  aria-label="Matiz"
                  aria-valuenow={Math.round(draftHsv.h)}
                  tabIndex={0}
                  className="relative h-4 w-full cursor-pointer touch-none rounded-full border border-stone-200"
                  style={{
                    background:
                      'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    hueDragging.current = true
                    handleHuePointer(e)
                  }}
                  onPointerMove={(e) => {
                    if (hueDragging.current) handleHuePointer(e)
                  }}
                  onPointerUp={() => {
                    hueDragging.current = false
                  }}
                  onPointerCancel={() => {
                    hueDragging.current = false
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      const delta = e.key === 'ArrowLeft' ? -4 : 4
                      setDraftHsv((prev) => ({
                        ...prev,
                        h: (prev.h + delta + 360) % 360,
                      }))
                    }
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                    style={{
                      left: `${(draftHsv.h / 360) * 100}%`,
                      backgroundColor: `hsl(${draftHsv.h} 100% 50%)`,
                      outline: '1px solid rgba(0,0,0,0.35)',
                    }}
                  />
                </div>

                {/* Entradas HEX y RGB */}
                <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="picker-hex"
                      className="text-[10px] font-semibold uppercase tracking-wide text-stone-400"
                    >
                      Hex
                    </label>
                    <div className="flex h-9 items-center rounded-md border border-stone-200 bg-white px-2 focus-within:ring-2 focus-within:ring-ring">
                      <span className="text-xs text-stone-400">#</span>
                      <input
                        id="picker-hex"
                        value={hexText.replace('#', '').toUpperCase()}
                        onChange={(e) =>
                          commitHexText(`#${e.target.value.replace('#', '')}`)
                        }
                        onBlur={() => setHexText(draftHex)}
                        maxLength={6}
                        spellCheck={false}
                        className="w-[74px] bg-transparent font-mono text-xs uppercase outline-none"
                        aria-label="Color en hexadecimal"
                      />
                    </div>
                  </div>
                  {(['r', 'g', 'b'] as const).map((channel) => (
                    <div key={channel} className="min-w-0 flex-1 space-y-1">
                      <label
                        htmlFor={`picker-${channel}`}
                        className="text-[10px] font-semibold uppercase tracking-wide text-stone-400"
                      >
                        {channel.toUpperCase()}
                      </label>
                      <Input
                        id={`picker-${channel}`}
                        type="number"
                        min={0}
                        max={255}
                        value={draftRgb[channel]}
                        onChange={(e) => updateRgbChannel(channel, e.target.value)}
                        className="h-9 px-2 text-xs"
                        aria-label={`Canal ${channel.toUpperCase()} en RGB`}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Panel lateral: Aceptar/Cancelar + Nuevo/Actual */}
          <aside className="flex flex-col gap-3 sm:w-32">
            <div className="order-2 flex gap-2 sm:order-1 sm:flex-col">
              <Button
                type="button"
                onClick={handleAccept}
                className="h-9 flex-1 bg-primary text-primary-foreground hover:bg-primary/90 sm:flex-none"
              >
                Aceptar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
            </div>
            <div className="order-1 flex gap-3 sm:order-2 sm:flex-col sm:gap-2">
              {previewSwatch(draftHex, 'Nuevo')}
              {previewSwatch(initialHex, 'Actual')}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
