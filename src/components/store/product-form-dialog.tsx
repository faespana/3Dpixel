'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Film,
  Loader2,
  Percent,
  Plus,
  Save,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ColorPaletteEditor } from '@/components/store/color-palette-editor'
import { useToast } from '@/hooks/use-toast'
import {
  MAX_MEDIA_PER_PRODUCT,
  TIER_PRICE_KEYS,
  type MediaKind,
  type Product,
  type ProductColor,
  type ProductMedia,
  type TierPriceKey,
} from '@/lib/types'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Producto a editar; null para crear uno nuevo. */
  product: Product | null
  onSaved: () => void
}

const CATEGORY_OPTIONS = [
  { value: 'tomatodos', label: 'Tomatodos' },
  { value: 'jarros', label: 'Jarros' },
  { value: 'otros', label: 'Otros' },
]

/** Etiquetas de los niveles de precio por cantidad para el formulario. */
const TIER_LABELS: Record<TierPriceKey, string> = {
  priceDozen: '1 docena (12-23 und)',
  priceTwoDozen: '2 docenas (24-35 und)',
  priceThreeDozen: '3 docenas (36-47 und)',
  priceBulk: 'Más de 3 docenas (48+ und)',
}

type TierFormState = Record<TierPriceKey, { enabled: boolean; value: string }>

const EMPTY_TIERS: TierFormState = {
  priceDozen: { enabled: false, value: '' },
  priceTwoDozen: { enabled: false, value: '' },
  priceThreeDozen: { enabled: false, value: '' },
  priceBulk: { enabled: false, value: '' },
}

function tiersFromProduct(product: Product | null): TierFormState {
  if (!product) return { ...EMPTY_TIERS }
  const state = { ...EMPTY_TIERS }
  for (const key of TIER_PRICE_KEYS) {
    const value = product[key]
    if (typeof value === 'number' && value > 0) {
      state[key] = { enabled: true, value: value.toFixed(2) }
    }
  }
  return state
}

/** Archivo nuevo agregado en el formulario (aún no guardado en el servidor). */
interface NewMediaFile {
  file: File
  url: string
  type: MediaKind
}

const MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const isEditing = product !== null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [tiers, setTiers] = useState<TierFormState>({ ...EMPTY_TIERS })
  const [category, setCategory] = useState('tomatodos')
  const [featured, setFeatured] = useState(false)
  /** Media existente en el servidor que se conserva (en orden). */
  const [keptMedia, setKeptMedia] = useState<ProductMedia[]>([])
  /** Archivos nuevos agregados en esta sesión del formulario. */
  const [newFiles, setNewFiles] = useState<NewMediaFile[]>([])
  /** Paleta de colores disponible del producto. */
  const [colors, setColors] = useState<ProductColor[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const totalMedia = keptMedia.length + newFiles.length
  const firstImageSource = [...keptMedia, ...newFiles].find(
    (m) => m.type === 'image'
  )
  /** Lista combinada (existentes + nuevos) para renderizar las miniaturas. */
  const displayItems: { id: string; url: string; type: MediaKind; isNew: boolean }[] = [
    ...keptMedia.map((m) => ({ id: m.id, url: m.url, type: m.type, isNew: false })),
    ...newFiles.map((m) => ({ id: m.url, url: m.url, type: m.type, isNew: true })),
  ]
  const firstImageId = displayItems.find((m) => m.type === 'image')?.id ?? null

  const revokeNewUrls = (files: NewMediaFile[]) => {
    for (const item of files) URL.revokeObjectURL(item.url)
  }

  useEffect(() => {
    if (open) {
      setName(product?.name ?? '')
      setDescription(product?.description ?? '')
      setPrice(product ? product.price.toFixed(2) : '')
      setTiers(tiersFromProduct(product))
      setCategory(product?.category ?? 'tomatodos')
      setFeatured(product?.featured ?? false)
      setKeptMedia(product ? product.media.map((m) => ({ ...m })) : [])
      setNewFiles([])
      setColors(product ? product.colors.map((c) => ({ ...c })) : [])
      setError('')
    } else {
      // Al cerrar, libera las URLs de vista previa
      setNewFiles((prev) => {
        revokeNewUrls(prev)
        return []
      })
    }
  }, [open, product])

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    e.target.value = ''

    setError('')
    const accepted: NewMediaFile[] = []
    for (const file of selected) {
      const isImage =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/webp' ||
        file.type === 'image/gif'
      const isVideo =
        file.type === 'video/mp4' ||
        file.type === 'video/webm' ||
        file.type === 'video/quicktime'

      if (!isImage && !isVideo) {
        setError(
          'Formato no permitido. Fotos: JPG, PNG, WEBP o GIF. Videos: MP4, WEBM o MOV.'
        )
        continue
      }
      if (isImage && file.size > 5 * 1024 * 1024) {
        setError('Una de las fotos supera el límite de 5MB')
        continue
      }
      if (isVideo && file.size > 30 * 1024 * 1024) {
        setError('Uno de los videos supera el límite de 30MB')
        continue
      }
      accepted.push({
        file,
        url: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
      })
    }

    if (accepted.length === 0) return
    setNewFiles((prev) => {
      const room = MAX_MEDIA_PER_PRODUCT - keptMedia.length - prev.length
      if (room <= 0) {
        setError(`Máximo ${MAX_MEDIA_PER_PRODUCT} fotos/videos por producto`)
        revokeNewUrls(accepted)
        return prev
      }
      if (accepted.length > room) {
        setError(
          `Solo se agregaron ${room} archivo(s): el límite es ${MAX_MEDIA_PER_PRODUCT} fotos/videos por producto`
        )
        revokeNewUrls(accepted.slice(room))
        return [...prev, ...accepted.slice(0, room)]
      }
      return [...prev, ...accepted]
    })
  }

  const handleRemoveKept = (id: string) => {
    setKeptMedia((prev) => prev.filter((m) => m.id !== id))
  }

  const handleRemoveNew = (url: string) => {
    setNewFiles((prev) => {
      const target = prev.find((m) => m.url === url)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((m) => m.url !== url)
    })
  }

  const updateTier = (key: TierPriceKey, patch: Partial<TierFormState[keyof TierFormState]>) => {
    setTiers((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !description.trim()) {
      setError('El nombre y la descripción son obligatorios')
      return
    }
    const basePrice = Number(price)
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setError('Ingresa un precio válido mayor a 0')
      return
    }
    for (const key of TIER_PRICE_KEYS) {
      const tier = tiers[key]
      if (!tier.enabled) continue
      const value = Number(tier.value)
      if (!tier.value.trim() || !Number.isFinite(value) || value <= 0) {
        setError(`Ingresa un precio válido para ${TIER_LABELS[key]}`)
        return
      }
      if (value >= basePrice) {
        setError(
          `El precio para ${TIER_LABELS[key]} debe ser menor al precio normal (1-11 und)`
        )
        return
      }
    }
    if (!firstImageSource) {
      setError('Debes subir al menos una foto del producto (los videos son adicionales)')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('description', description.trim())
      formData.append('price', String(basePrice))
      for (const key of TIER_PRICE_KEYS) {
        const tier = tiers[key]
        formData.append(key, tier.enabled ? String(Number(tier.value)) : '')
      }
      formData.append('category', category)
      formData.append('featured', String(featured))
      formData.append(
        'colors',
        JSON.stringify(
          colors.map((c) => ({
            name: c.name.trim(),
            hex: c.hex,
          }))
        )
      )

      // Galería: qué media existente se conserva + archivos nuevos
      if (isEditing) {
        formData.append('keepMedia', JSON.stringify(keptMedia.map((m) => m.id)))
      }
      for (const item of newFiles) {
        formData.append('media', item.file)
      }

      const res = await fetch(
        isEditing ? `/api/products/${product.id}` : '/api/products',
        {
          method: isEditing ? 'PATCH' : 'POST',
          body: formData,
        }
      )
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'No se pudo guardar el producto')
        return
      }

      toast({
        title: isEditing ? 'Producto actualizado' : 'Producto creado',
        description: name,
      })
      onSaved()
      onOpenChange(false)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  /** Miniatura de un archivo de la galería (existente o nuevo). */
  const renderThumb = (
    key: string,
    url: string,
    type: MediaKind,
    isCover: boolean,
    onRemove: () => void
  ) => (
    <div
      key={key}
      className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
    >
      {type === 'image' ? (
        <img
          src={url}
          alt={isCover ? 'Portada del producto' : 'Vista previa de foto'}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-md bg-stone-900/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Film className="h-3 w-3" aria-hidden="true" />
            Video
          </span>
        </>
      )}
      {isCover && (
        <span className="absolute left-1 top-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
          Portada
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={saving}
        aria-label="Quitar archivo de la galería"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-red-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza los datos del producto. Puedes cambiar sus fotos y videos.'
              : 'Completa la información y sube fotos para publicar el producto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fotos y videos ({totalMedia}/{MAX_MEDIA_PER_PRODUCT})</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {displayItems.map((m) =>
                renderThumb(
                  m.id,
                  m.url,
                  m.type,
                  m.type === 'image' && m.id === firstImageId,
                  () =>
                    m.isNew ? handleRemoveNew(m.url) : handleRemoveKept(m.id)
                )
              )}
              {totalMedia < MAX_MEDIA_PER_PRODUCT && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 transition hover:border-primary/50 hover:bg-secondary/30 hover:text-primary disabled:opacity-50"
                  aria-label="Agregar fotos o videos"
                >
                  <Plus className="h-6 w-6" aria-hidden="true" />
                  <span className="px-1 text-center text-[10px] font-medium leading-tight">
                    Agregar fotos o videos
                  </span>
                </button>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Fotos: JPG, PNG, WEBP o GIF (máx. 5MB). Videos cortos: MP4, WEBM o
              MOV (máx. 30MB). La primera foto será la portada.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={MEDIA_ACCEPT}
              multiple
              className="sr-only"
              onChange={handleFilesChange}
              aria-label="Subir fotos y videos del producto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tomatodo Térmico Rosa 1L"
              maxLength={80}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el producto: material, capacidad, colores disponibles..."
              rows={3}
              maxLength={300}
              disabled={saving}
            />
          </div>

          <ColorPaletteEditor
            colors={colors}
            onChange={setColors}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="product-price">Precio normal (USD)</Label>
              <Input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="18.00"
                disabled={saving}
              />
              <p className="text-[11px] leading-tight text-stone-500">
                Aplica para compras de 1 a 11 unidades.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Categoría</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={saving}
              >
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Percent className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800">
                  Precios por cantidad
                </p>
                <p className="text-[11px] leading-tight text-stone-500">
                  Marca los niveles donde quieres ofrecer un precio especial.
                </p>
              </div>
            </div>
            {TIER_PRICE_KEYS.map((key) => {
              const tier = tiers[key]
              return (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={`tier-${key}`}
                    checked={tier.enabled}
                    onCheckedChange={(checked) =>
                      updateTier(key, { enabled: checked === true })
                    }
                    disabled={saving}
                    aria-label={`Activar precio para ${TIER_LABELS[key]}`}
                  />
                  <Label
                    htmlFor={`tier-${key}`}
                    className="w-44 shrink-0 cursor-pointer text-xs font-medium text-stone-700 sm:w-52"
                  >
                    {TIER_LABELS[key]}
                  </Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={tier.value}
                    onChange={(e) => updateTier(key, { value: e.target.value })}
                    placeholder="0.00"
                    disabled={saving || !tier.enabled}
                    aria-label={`Precio para ${TIER_LABELS[key]}`}
                    className="h-9"
                  />
                </div>
              )
            })}
          </div>

          <label
            htmlFor="product-featured"
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700"
          >
            <Checkbox
              id="product-featured"
              checked={featured}
              onCheckedChange={(checked) => setFeatured(checked === true)}
              disabled={saving}
            />
            Marcar como producto destacado
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              {isEditing ? 'Guardar cambios' : 'Publicar producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
