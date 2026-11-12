'use client'

import { Pencil, ShoppingBag, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductMediaCarousel } from '@/components/store/product-media-carousel'
import { tierFieldsOf, useCartStore } from '@/store/cart'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/whatsapp'
import { getPriceTiers } from '@/lib/pricing'
import {
  categoryLabel,
  type Product,
} from '@/lib/types'

/** Indica si un color es claro (para reforzar el borde de la muestra). */
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}

interface ProductCardProps {
  product: Product
  isAdmin?: boolean
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
}

export function ProductCard({
  product,
  isAdmin = false,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { toast } = useToast()
  const tiers = getPriceTiers(product)
  const colors = product.colors ?? []

  // Galería: media guardado + portada como respaldo
  const media =
    product.media && product.media.length > 0
      ? product.media.map((m) => ({ url: m.url, type: m.type }))
      : [{ url: product.image, type: 'image' as const }]

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      ...tierFieldsOf(product),
      image: product.image,
    })
    toast({
      title: 'Producto agregado al carrito',
      description: product.name,
    })
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-card shadow-xs transition-shadow duration-300 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <ProductMediaCarousel media={media} productName={product.name} />
        {product.featured && (
          <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground shadow-sm">
            <Star className="h-3 w-3" aria-hidden="true" />
            Destacado
          </span>
        )}
        {isAdmin && (
          <div className="absolute right-2.5 top-2.5 z-20 flex gap-1.5">
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-white/95 text-stone-600 shadow-sm hover:bg-white hover:text-primary"
              onClick={() => onEdit?.(product)}
              aria-label={`Editar ${product.name}`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-white/95 text-red-500 shadow-sm hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete?.(product)}
              aria-label={`Eliminar ${product.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          {categoryLabel(product.category)}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-stone-900 md:text-base">
          {product.name}
        </h3>
        <p className="mt-1.5 hidden line-clamp-2 text-xs leading-relaxed text-stone-500 sm:block">
          {product.description}
        </p>
        {colors.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-700">
              Colores disponibles
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {colors.map((color, index) => (
                <div
                  key={`${color.hex}-${index}`}
                  className="flex max-w-14 flex-col items-center gap-0.5"
                  title={color.name}
                >
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 rounded-full border border-stone-300 shadow-inner"
                    style={{
                      backgroundColor: color.hex,
                      boxShadow: isLightColor(color.hex)
                        ? 'inset 0 1px 2px rgba(0,0,0,0.12)'
                        : undefined,
                    }}
                  />
                  <span className="max-w-full truncate text-[9px] leading-none text-stone-500">
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto pt-3">
          <p className="text-lg font-bold text-stone-900">
            {formatPrice(product.price)}
            <span className="ml-1 text-[11px] font-medium text-stone-400">
              / und
            </span>
          </p>
          {tiers.length > 1 && (
            <div className="mt-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                Precios por cantidad
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {tiers.slice(1).map((tier) => (
                  <span
                    key={tier.key}
                    className="rounded-md bg-secondary/45 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700"
                  >
                    {tier.rangeLabel}: {formatPrice(tier.price)}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Button
            onClick={handleAdd}
            className="mt-2.5 h-10 w-full rounded-full bg-primary text-sm text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingBag aria-hidden="true" />
            Agregar
          </Button>
        </div>
      </div>
    </article>
  )
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3 md:p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  )
}
