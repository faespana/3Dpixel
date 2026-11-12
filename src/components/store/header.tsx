'use client'

import Image from 'next/image'
import { LogIn, MessageCircle, Search, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCartStore, useCartTotals } from '@/store/cart'
import { useIsHydrated } from '@/hooks/use-hydrated'
import { whatsappChatLink } from '@/lib/whatsapp'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
  isAdmin: boolean
  onOpenLogin: () => void
}

export function Header({
  search,
  onSearchChange,
  isAdmin,
  onOpenLogin,
}: HeaderProps) {
  const mounted = useIsHydrated()
  const { count } = useCartTotals()
  const setOpen = useCartStore((s) => s.setOpen)

  const cartCount = mounted ? count : 0
  const waLink = whatsappChatLink(
    'Hola 3D PIXEL, quiero información sobre los tomatodos y jarros disponibles.'
  )

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center gap-3">
          <a
            href="#"
            className="flex shrink-0 items-center"
            aria-label="3D PIXEL, ir al inicio"
          >
            <Image
              src="/logo-3dpixel.png"
              alt="3D PIXEL - Detalles, Diseños y Decoraciones"
              width={120}
              height={48}
              priority
              className="h-11 w-auto"
            />
          </a>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="relative w-full max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar tomatodos, jarros, termos..."
                className="h-10 rounded-full border-stone-200 bg-stone-50 pl-9 pr-4"
                aria-label="Buscar productos"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!isAdmin && (
              <Button
                variant="outline"
                className="h-10 rounded-full border-stone-200 bg-white px-3 sm:px-4"
                onClick={onOpenLogin}
                aria-label="Iniciar sesión como administrador"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Button>
            )}

            <Button
              asChild
              className="hidden h-10 rounded-full bg-[#25D366] px-4 text-white hover:bg-[#1ebe5d] sm:inline-flex"
            >
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
            <Button
              asChild
              className="h-10 w-10 rounded-full bg-[#25D366] p-0 text-white hover:bg-[#1ebe5d] sm:hidden"
            >
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escríbenos por WhatsApp"
              >
                <MessageCircle aria-hidden="true" />
              </a>
            </Button>

            <Button
              variant="outline"
              className="relative h-10 rounded-full border-stone-200 bg-white px-3.5 hover:border-primary/40 hover:bg-secondary/20"
              onClick={() => setOpen(true)}
              aria-label={`Abrir carrito de compras, ${cartCount} artículos`}
            >
              <ShoppingBag
                className="h-5 w-5 text-stone-700"
                aria-hidden="true"
              />
              {cartCount > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white"
                  aria-hidden="true"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos..."
              className="h-10 rounded-full border-stone-200 bg-stone-50 pl-9 pr-4"
              aria-label="Buscar productos"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
