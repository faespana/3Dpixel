import 'dotenv/config' // carga .env para poder ejecutarlo con: npx tsx prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/**
 * Precios por cantidad (opcional): docena, 2 docenas, 3 docenas y más de 3 docenas.
 * El precio normal aplica para 1-11 unidades.
 */
const products = [
  // ============ TOMATODOS ============
  {
    name: 'Tomatodo Térmico Rosa 1L',
    description:
      'Tomatodo de acero inoxidable con doble pared aislante. Mantiene tu bebida fría hasta 24 horas. Tapa con pajita y asa de transporte.',
    price: 18.0,
    priceDozen: 16.5,
    priceTwoDozen: 15.0,
    priceThreeDozen: 14.0,
    priceBulk: 13.0,
    category: 'tomatodos',
    image: '/images/products/tomatodo-rosa.png',
    featured: true,
  },
  {
    name: 'Tomatodo Deportivo Negro 750ml',
    description:
      'Botella deportiva liviana con tapa flip-top de apertura rápida y anillo de sujeción. Ideal para gimnasio, running y outdoor.',
    price: 14.0,
    priceDozen: 13.0,
    priceTwoDozen: 12.0,
    priceThreeDozen: 11.25,
    priceBulk: 10.5,
    category: 'tomatodos',
    image: '/images/products/tomatodo-deportivo.png',
    featured: false,
  },
  {
    name: 'Tomatodo Térmico Verde 900ml',
    description:
      'Estilo rústico, rendimiento total. Acero inoxidable 18/8 con doble pared al vacío, tapa metálica y asa de silicone. Libre de BPA.',
    price: 22.0,
    priceDozen: 20.5,
    priceTwoDozen: 19.0,
    priceThreeDozen: 18.0,
    priceBulk: 17.0,
    category: 'tomatodos',
    image: '/images/products/tomatodo-verde.png',
    featured: true,
  },
  {
    name: 'Tomatodo Transparente con Pajita 1.2L',
    description:
      'Botella de gym con marcaciones de consumo horario, funda de silicone antideslizante y pajita retráctil. Perfecta para tus metas de hidratación.',
    price: 12.5,
    priceDozen: 11.5,
    priceTwoDozen: 10.75,
    priceThreeDozen: 10.25,
    priceBulk: 9.75,
    category: 'tomatodos',
    image: '/images/products/tomatodo-transparente.png',
    featured: false,
  },
  // ============ JARROS ============
  {
    name: 'Jarro Térmico Blanco 1.9L',
    description:
      'Jarro térmico de acero con boquilla dispensadora y tapa a presión. Mantiene el agua fría o caliente por horas. Ideal para reuniones y oficina.',
    price: 28.0,
    priceDozen: 26.0,
    priceTwoDozen: 24.5,
    priceThreeDozen: 23.5,
    priceBulk: 22.5,
    category: 'jarros',
    image: '/images/products/jarro-blanco.png',
    featured: true,
  },
  {
    name: 'Jarro de Vidrio con Tapa 1.5L',
    description:
      'Jarro de vidrio resistente con tapa de bambú y asa ergonómica. Elegante para servir agua, jugos o infusiones en tu mesa.',
    price: 16.0,
    priceDozen: 15.0,
    priceTwoDozen: 14.0,
    priceThreeDozen: 13.25,
    priceBulk: 12.75,
    category: 'jarros',
    image: '/images/products/jarro-vidrio.png',
    featured: false,
  },
  {
    name: 'Jarro Térmico Verde 1.9L',
    description:
      'Jarro térmico con acabado verde salvia y asa de madera natural. Boquilla de vertido sin derrames y capacidad familiar de 1.9 litros.',
    price: 28.0,
    priceDozen: 26.0,
    priceTwoDozen: 24.5,
    priceThreeDozen: 23.5,
    priceBulk: 22.5,
    category: 'jarros',
    image: '/images/products/jarro-verde.png',
    featured: false,
  },
  // ============ OTROS ============
  {
    name: 'Termo Matero con Pico Cebador',
    description:
      'Termo de acero con pico cebador birabiro, ideal para mates y tereré. Conserva la temperatura perfecta durante todo el día.',
    price: 24.0,
    priceDozen: 22.5,
    priceTwoDozen: 21.0,
    priceThreeDozen: 20.0,
    priceBulk: 19.0,
    category: 'otros',
    image: '/images/products/termo-matero.png',
    featured: false,
  },
  {
    name: 'Vaso Térmico Crema 600ml',
    description:
      'Vaso térmico para café o bebidas frías con tapa deslizante antiderrame. Mantén tu bebida a la temperatura ideal mientras te mueves.',
    price: 15.0,
    priceDozen: 14.0,
    priceTwoDozen: 13.0,
    priceThreeDozen: 12.25,
    priceBulk: 11.75,
    category: 'otros',
    image: '/images/products/vaso-termico.png',
    featured: false,
  },
  {
    name: 'Botella Plegable de Silicona 500ml',
    description:
      'Botella plegable de silicona grado alimenticio, ultracompacta para viajar. Colócala en tu bolso cuando esté vacía. Libre de BPA.',
    price: 10.0,
    priceDozen: 9.25,
    priceTwoDozen: 8.75,
    priceThreeDozen: 8.25,
    priceBulk: 7.75,
    category: 'otros',
    image: '/images/products/botella-plegable.png',
    featured: true,
  },
]

/**
 * Fotos adicionales de la galería para los productos destacados.
 * La primera foto siempre coincide con la portada (`image`).
 */
const extraMedia: Record<string, string[]> = {
  'Tomatodo Térmico Rosa 1L': ['/images/products/tomatodo-rosa-2.png'],
  'Tomatodo Térmico Verde 900ml': ['/images/products/tomatodo-verde-2.png'],
  'Jarro Térmico Blanco 1.9L': ['/images/products/jarro-blanco-2.png'],
  'Botella Plegable de Silicona 500ml': [
    '/images/products/botella-plegable-2.png',
  ],
}

/**
 * Paletas de colores de ejemplo por producto (se guardan como JSON).
 */
const productColors: Record<string, { name: string; hex: string }[]> = {
  'Tomatodo Térmico Rosa 1L': [
    { name: 'Rosa', hex: '#e39cb5' },
    { name: 'Blanco', hex: '#f5f5f5' },
    { name: 'Negro', hex: '#1c1c1c' },
  ],
  'Tomatodo Deportivo Negro 750ml': [
    { name: 'Negro', hex: '#1c1c1c' },
    { name: 'Gris', hex: '#8a8a8a' },
    { name: 'Rojo', hex: '#c0392b' },
  ],
  'Tomatodo Térmico Verde 900ml': [
    { name: 'Verde salvia', hex: '#7a9b76' },
    { name: 'Crema', hex: '#efe6d8' },
    { name: 'Negro', hex: '#1c1c1c' },
  ],
  'Tomatodo Transparente con Pajita 1.2L': [
    { name: 'Celeste', hex: '#a8d8ea' },
    { name: 'Rosa claro', hex: '#f2c6cf' },
    { name: 'Violeta', hex: '#b9a7d8' },
  ],
  'Jarro Térmico Blanco 1.9L': [
    { name: 'Blanco', hex: '#f5f5f5' },
    { name: 'Mate', hex: '#c2c2c2' },
    { name: 'Negro', hex: '#1c1c1c' },
  ],
  'Jarro de Vidrio con Tapa 1.5L': [
    { name: 'Transparente', hex: '#e8f4f8' },
    { name: 'Bambú', hex: '#c8a876' },
  ],
  'Jarro Térmico Verde 1.9L': [
    { name: 'Verde salvia', hex: '#7a9b76' },
    { name: 'Crema', hex: '#efe6d8' },
    { name: 'Madera', hex: '#a97b50' },
  ],
  'Termo Matero con Pico Cebador': [
    { name: 'Acero', hex: '#b0b6ba' },
    { name: 'Negro', hex: '#1c1c1c' },
    { name: 'Verde', hex: '#4f7942' },
  ],
  'Vaso Térmico Crema 600ml': [
    { name: 'Crema', hex: '#efe6d8' },
    { name: 'Rosa', hex: '#e39cb5' },
    { name: 'Blanco', hex: '#f5f5f5' },
  ],
  'Botella Plegable de Silicona 500ml': [
    { name: 'Celeste', hex: '#a8d8ea' },
    { name: 'Rosa', hex: '#e39cb5' },
    { name: 'Verde menta', hex: '#9fd8b4' },
  ],
}

async function main() {
  const count = await db.product.count()
  if (count > 0) {
    console.log(`Seed omitido: ya existen ${count} productos.`)
    return
  }

  for (const product of products) {
    const extras = extraMedia[product.name] ?? []
    const colors = productColors[product.name] ?? []
    await db.product.create({
      data: {
        ...product,
        colors: JSON.stringify(colors),
        media: {
          create: [
            { url: product.image, type: 'image', order: 0 },
            ...extras.map((url, index) => ({
              url,
              type: 'image',
              order: index + 1,
            })),
          ],
        },
      },
    })
  }
  console.log(`Seed completado: ${products.length} productos creados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

export { products }
