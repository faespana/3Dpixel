'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * Detecta si el componente ya está hidratado en el cliente.
 * Alternativa segura a setState dentro de useEffect.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
