'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore, useCartTotals, itemUnitPrice } from '@/store/cart'
import { useToast } from '@/hooks/use-toast'
import { useIsHydrated } from '@/hooks/use-hydrated'
import { formatPrice, openWhatsAppOrder } from '@/lib/whatsapp'
import { getNextTierHint } from '@/lib/pricing'
import { isUploadedImage } from '@/lib/types'
import { cn } from '@/lib/utils'

const SHIPPING_OPTIONS = [
  { id: 'delivery', label: 'Envío a domicilio', icon: Truck },
  { id: 'pickup', label: 'Recojo en tienda', icon: Store },
] as const

type ShippingId = (typeof SHIPPING_OPTIONS)[number]['id']

export function CartSheet() {
  const [shipping, setShipping] = useState<ShippingId>('delivery')
  // Evita diferencias de hidratación con el carrito persistido
  const mounted = useIsHydrated()

  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const setOpen = useCartStore((s) => s.setOpen)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const { total, count } = useCartTotals()
  const { toast } = useToast()

  // Evita diferencias de hidratación con el carrito persistido
  const visibleItems = mounted ? items : []
  const visibleTotal = mounted ? total : 0
  const visibleCount = mounted ? count : 0

  const shippingLabel =
    SHIPPING_OPTIONS.find((o) => o.id === shipping)?.label ?? 'Envío a domicilio'

  const handleCheckout = () => {
    if (items.length === 0) return
    openWhatsAppOrder(
      items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: itemUnitPrice(item),
      })),
      shippingLabel
    )
    toast({
      title: 'Abriendo WhatsApp',
      description: 'Te llevamos a WhatsApp para confirmar tu pedido.',
    })
  }

  const scrollToProducts = () => {
    setOpen(false)
    window.setTimeout(() => {
      document
        .getElementById('productos')
        ?.scrollIntoView({ behavior: 'smooth' })
    }, 350)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-stone-200 px-4 py-4">
          <SheetTitle className="text-base">Tu carrito</SheetTitle>
          <SheetDescription>
            {visibleCount === 0
              ? 'Aún no has agregado productos'
              : `${visibleCount} ${visibleCount === 1 ? 'artículo' : 'artículos'} en tu pedido`}
          </SheetDescription>
        </SheetHeader>

        {visibleItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <ShoppingBag className="h-8 w-8" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-stone-900">
              Tu carrito está vacío
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Explora el catálogo y agrega tus tomatodos o jarros favoritos.
            </p>
            <Button
              onClick={scrollToProducts}
              className="mt-5 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              Explorar productos
            </Button>
          </div>
        ) : (
          <>
            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {visibleItems.map((item) => {
                const unit = itemUnitPrice(item)
                const hasDiscount = unit < item.price
                const hint = getNextTierHint(item, item.quantity)
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        unoptimized={isUploadedImage(item.image)}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                          {item.name}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-stone-400 hover:bg-red-50 hover:text-red-500"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Quitar ${item.name} del carrito`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {hasDiscount && (
                          <span className="mr-1 line-through">
                            {formatPrice(item.price)}
                          </span>
                        )}
                        <span
                          className={cn(
                            hasDiscount && 'font-semibold text-primary'
                          )}
                        >
                          {formatPrice(unit)} c/u
                        </span>
                        {hasDiscount && (
                          <span className="ml-1.5 rounded bg-secondary/45 px-1 py-0.5 text-[10px] font-semibold text-stone-700">
                            Por cantidad
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-stone-200"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <span
                            className="w-6 text-center text-sm font-semibold text-stone-800"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-stone-200"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 99}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                        <p className="text-sm font-bold text-stone-900">
                          {formatPrice(unit * item.quantity)}
                        </p>
                      </div>
                      {hint && (
                        <p className="mt-1.5 text-[11px] font-medium text-primary">
                          Agrega {hint.addMore}{' '}
                          {hint.addMore === 1 ? 'unidad más' : 'unidades más'} y
                          paga {formatPrice(hint.price)} c/u
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-stone-200 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="text-xs font-semibold text-stone-700">
                Método de entrega
              </p>
              <div
                className="mt-2 grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label="Método de entrega"
              >
                {SHIPPING_OPTIONS.map((option) => {
                  const active = shipping === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setShipping(option.id)}
                      className={cn(
                        'flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium transition-colors',
                        active
                          ? 'border-primary bg-secondary/20 text-primary'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-primary/40'
                      )}
                    >
                      <option.icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Total</span>
                <span className="text-xl font-bold text-stone-900">
                  {formatPrice(visibleTotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                El pago y el envío se coordinan por WhatsApp.
              </p>

              <Button
                onClick={handleCheckout}
                className="mt-4 h-12 w-full rounded-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#1ebe5d]"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Pagar por WhatsApp
              </Button>
              <Button
                variant="ghost"
                onClick={clearCart}
                className="mt-2 h-9 w-full text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Vaciar carrito
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
