'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { isUploadedImage, type MediaKind } from '@/lib/types'

export interface CarouselMedia {
  url: string
  type: MediaKind
}

interface ProductMediaCarouselProps {
  media: CarouselMedia[]
  productName: string
}

/**
 * Galería deslizable de un producto: fotos y videos cortos con flechas
 * laterales, puntos de posición y soporte de gesto de deslizamiento.
 */
export function ProductMediaCarousel({
  media,
  productName,
}: ProductMediaCarouselProps) {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined)
  const [current, setCurrent] = useState(0)
  const count = media.length

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const scrollTo = useCallback(
    (index: number) => api?.scrollTo(index),
    [api]
  )

  return (
    <Carousel
      setApi={setApi}
      className="h-full w-full"
      opts={{ loop: false, dragFree: false }}
    >
      <CarouselContent className="m-0 aspect-square">
        {media.map((item, index) => (
          <CarouselItem key={`${item.url}-${index}`} className="p-0">
            <div className="relative h-full w-full bg-stone-100">
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full bg-stone-900 object-cover"
                  aria-label={`Video ${index + 1} de ${productName}`}
                />
              ) : (
                <Image
                  src={item.url}
                  alt={`${productName} - foto ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized={isUploadedImage(item.url)}
                  draggable={false}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority={index === 0}
                />
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {count > 1 && (
        <>
          {/* Flecha izquierda */}
          {current > 0 && (
            <button
              type="button"
              onClick={() => scrollTo(current - 1)}
              aria-label="Foto anterior"
              className="absolute left-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-primary active:scale-95"
            >
              <ChevronLeft className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          )}
          {/* Flecha derecha */}
          {current < count - 1 && (
            <button
              type="button"
              onClick={() => scrollTo(current + 1)}
              aria-label="Siguiente foto"
              className="absolute right-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-primary active:scale-95"
            >
              <ChevronRight className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          )}
          {/* Puntos de posición */}
          <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1.5">
            {media.map((item, index) => (
              <button
                key={`dot-${item.url}-${index}`}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`Ir a la posición ${index + 1}`}
                aria-current={current === index}
                className={
                  current === index
                    ? 'h-1.5 w-4 rounded-full bg-white shadow-sm transition-all'
                    : 'h-1.5 w-1.5 rounded-full bg-white/60 shadow-sm transition-all hover:bg-white/90'
                }
              />
            ))}
          </div>
        </>
      )}
    </Carousel>
  )
}
