/**
 * Utilidades para la integración con WhatsApp.
 * Número de la tienda: +593 98 904 5163
 */
export const WHATSAPP_PHONE = '593989045163'
export const WHATSAPP_DISPLAY = '+593 98 904 5163'

export interface CartLine {
  name: string
  quantity: number
  /** Precio unitario ya calculado según la cantidad (escala por docenas). */
  unitPrice: number
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

/** Enlace genérico para iniciar una conversación por WhatsApp. */
export function whatsappChatLink(message: string): string {
  const text =
    message ??
    'Hola 3D PIXEL, quiero información sobre los tomatodos y jarros disponibles.'
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`
}

/** Construye el mensaje de pedido con los productos del carrito. */
export function buildOrderMessage(items: CartLine[], shipping: string): string {
  const lines = items.map(
    (item, index) =>
      `${index + 1}. ${item.name} x${item.quantity} (${formatPrice(
        item.unitPrice
      )} c/u) = ${formatPrice(item.unitPrice * item.quantity)}`
  )

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  return [
    'Hola 3D PIXEL, quiero realizar el siguiente pedido:',
    '',
    ...lines,
    '',
    `Total: ${formatPrice(total)}`,
    '',
    `Para la entrega: ${shipping}`,
    '',
    'Quedo atento(a) para coordinar el pago y la entrega. Gracias.',
  ].join('\n')
}

/** Abre WhatsApp con el pedido en una pestaña nueva. */
export function openWhatsAppOrder(items: CartLine[], shipping: string): void {
  const url = whatsappChatLink(buildOrderMessage(items, shipping))
  window.open(url, '_blank', 'noopener,noreferrer')
}
