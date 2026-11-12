'use client'

import Image from 'next/image'
import {
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { whatsappChatLink } from '@/lib/whatsapp'

const FEATURES: { icon: LucideIcon; title: string; subtitle: string }[] = [
  { icon: Truck, title: 'Envío nacional', subtitle: 'A todo el Ecuador' },
  { icon: ShieldCheck, title: 'Garantía real', subtitle: '6 meses por defectos' },
  { icon: CreditCard, title: 'Pago fácil', subtitle: 'Transferencia o efectivo' },
  { icon: MessageCircle, title: 'Atención directa', subtitle: 'Por WhatsApp' },
]

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-secondary/20 via-accent/30 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Envíos a todo el Ecuador
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              Hidrátate con estilo,{' '}
              <span className="text-primary">donde quieras</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-600 md:text-lg">
              3D PIXEL trae para ti tomatodos térmicos, jarros y accesorios de
              la mejor calidad. Compra en línea, agrega al carrito y finaliza
              tu pedido directamente por WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="h-11 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
              >
                <a href="#productos">Ver catálogo</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-cyan-300 bg-white px-6 text-cyan-700 hover:bg-accent hover:text-accent-foreground"
              >
                <a
                  href={whatsappChatLink(
                    'Hola 3D PIXEL, quiero hacer una consulta sobre sus productos.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden="true" />
                  Escríbenos
                </a>
              </Button>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg">
              <Image
                src="/images/hero-banner-v3.png"
                alt="Colección de tomatodos y jarros de 3D PIXEL"
                width={1344}
                height={768}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/80 p-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800">
                  {feature.title}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {feature.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
