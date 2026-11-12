'use client'

import { MessageCircle } from 'lucide-react'
import { whatsappChatLink } from '@/lib/whatsapp'

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappChatLink(
        'Hola, quiero hacer un pedido o consultar por un producto.'
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatea con nosotros por WhatsApp"
      title="Chatea con nosotros por WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
    >
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-25"
        aria-hidden="true"
      />
      <MessageCircle className="relative h-7 w-7" aria-hidden="true" />
    </a>
  )
}
