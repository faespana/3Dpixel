'use client'

import Image from 'next/image'
import {
  Clock,
  MapPin,
  MessageCircle,
} from 'lucide-react'
import {
  WHATSAPP_DISPLAY,
  whatsappChatLink,
} from '@/lib/whatsapp'
import { CATEGORIES } from '@/lib/types'

interface FooterProps {
  onSelectCategory: (category: string) => void
}

export function Footer({ onSelectCategory }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="inline-flex rounded-xl bg-white px-3 py-2">
              <Image
                src="/logo-3dpixel.png"
                alt="3D PIXEL - Detalles, Diseños y Decoraciones"
                width={130}
                height={52}
                className="h-12 w-auto"
              />
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400">
              Tu tienda online de tomatodos, jarros y accesorios de
              hidratación. Detalles, diseños y decoraciones para tu día a día.
              Compra fácil y coordina tu pedido por WhatsApp.
            </p>
          </div>

          <nav aria-label="Categorías del catálogo">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              Catálogo
            </h3>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.filter((c) => c.id !== 'todos').map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className="text-sm text-stone-400 transition-colors hover:text-secondary"
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              Contacto y horarios
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-stone-400">
              <li>
                <a
                  href={whatsappChatLink('Hola 3D PIXEL, quiero hacer una consulta.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-secondary"
                >
                  <MessageCircle
                    className="h-4 w-4 text-[#25D366]"
                    aria-hidden="true"
                  />
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 text-cyan-400"
                  aria-hidden="true"
                />
                Envíos a todo el Ecuador
              </li>
              <li className="flex items-center gap-2">
                <Clock
                  className="h-4 w-4 text-pink-400"
                  aria-hidden="true"
                />
                Lun a Sáb, 9:00 - 18:00
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-center text-xs text-stone-500">
          © {year} 3D PIXEL - Detalles, Diseños & Decoraciones. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  )
}
