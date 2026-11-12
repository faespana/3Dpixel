'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getUnitPrice } from '@/lib/pricing'
import type { TierPriceKey } from '@/lib/types'

export interface CartItem {
  id: string
  name: string
  price: number
  priceDozen?: number | null
  priceTwoDozen?: number | null
  priceThreeDozen?: number | null
  priceBulk?: number | null
  image: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setOpen: (open: boolean) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, 99) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity }] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id ? { ...i, quantity: Math.min(quantity, 99) } : i
                ),
        })),
      clearCart: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: '3dpixel-cart',
      // Persiste únicamente los productos; el estado de la UI no debe sobrevivir la recarga
      partialize: (state) => ({ items: state.items }),
    }
  )
)

/** Extrae los precios por cantidad de un producto para el carrito. */
export function tierFieldsOf(product: {
  priceDozen: number | null
  priceTwoDozen: number | null
  priceThreeDozen: number | null
  priceBulk: number | null
}): Pick<CartItem, TierPriceKey> {
  return {
    priceDozen: product.priceDozen,
    priceTwoDozen: product.priceTwoDozen,
    priceThreeDozen: product.priceThreeDozen,
    priceBulk: product.priceBulk,
  }
}

/** Precio unitario actual de una línea del carrito según su cantidad. */
export function itemUnitPrice(item: CartItem): number {
  return getUnitPrice(item, item.quantity)
}

export function useCartTotals() {
  const items = useCartStore((s) => s.items)
  const total = items.reduce(
    (sum, i) => sum + itemUnitPrice(i) * i.quantity,
    0
  )
  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  return { total, count }
}
