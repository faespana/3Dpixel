'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CupSoda,
  GlassWater,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  RotateCcw,
  SearchX,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/store/header'
import { Hero } from '@/components/store/hero'
import { Footer } from '@/components/store/footer'
import { CartSheet } from '@/components/store/cart-sheet'
import { FloatingWhatsApp } from '@/components/store/floating-whatsapp'
import { LoginDialog } from '@/components/store/login-dialog'
import { ProductFormDialog } from '@/components/store/product-form-dialog'
import { ProductCard, ProductSkeleton } from '@/components/store/product-card'
import { useToast } from '@/hooks/use-toast'
import { whatsappChatLink } from '@/lib/whatsapp'
import {
  CATEGORIES,
  categoryLabel,
  type CategoryId,
  type Product,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  todos: LayoutGrid,
  tomatodos: GlassWater,
  jarros: CupSoda,
  otros: Package,
}

export function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId>('todos')

  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Error al cargar')
      setProducts(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Consulta la sesión del administrador al cargar la página
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(Boolean(data?.authenticated))
        setUsername(data?.username ?? null)
      })
      .catch(() => {})
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      todos: products.length,
      tomatodos: 0,
      jarros: 0,
      otros: 0,
    }
    for (const p of products) {
      if (c[p.category] !== undefined) c[p.category]++
    }
    return c
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchCategory =
        category === 'todos' || p.category === category
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q)
      return matchCategory && matchQuery
    })
  }, [products, search, category])

  const handleSelectCategory = (value: string) => {
    setCategory(value as CategoryId)
    document
      .getElementById('productos')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  const resetFilters = () => {
    setSearch('')
    setCategory('todos')
  }

  const handleLoginSuccess = (name: string) => {
    setIsAdmin(true)
    setUsername(name)
    toast({
      title: 'Sesión iniciada',
      description: `Bienvenido(a), ${name}. Ya puedes gestionar los productos.`,
    })
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setIsAdmin(false)
      setUsername(null)
      toast({ title: 'Sesión cerrada' })
    }
  }

  const openCreateProduct = () => {
    setEditingProduct(null)
    setFormOpen(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({
          title: 'No se pudo eliminar',
          description: data.error ?? 'Intenta de nuevo',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Producto eliminado',
        description: deletingProduct.name,
      })
      void load()
    } catch {
      toast({
        title: 'Error de conexión',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeletingProduct(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header
        search={search}
        onSearchChange={setSearch}
        isAdmin={isAdmin}
        onOpenLogin={() => setLoginOpen(true)}
      />

      {isAdmin && (
        <div className="border-b border-pink-200/70 bg-gradient-to-r from-secondary/25 via-white to-accent/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 sm:gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-stone-800">
              Modo administrador
              {username && (
                <span className="font-normal text-stone-500">
                  {' '}
                  · {username}
                </span>
              )}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                onClick={openCreateProduct}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus aria-hidden="true" />
                Nuevo producto
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="rounded-full border-stone-300 bg-white"
              >
                <LogOut aria-hidden="true" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Hero />

        <section id="productos" className="scroll-mt-24 pb-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="pt-2">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
                Nuestro catálogo
              </h2>
              <p className="mt-1 text-sm text-stone-500 md:text-base">
                Agrega productos al carrito y finaliza tu pedido por WhatsApp
              </p>
            </div>

            <div
              className="mt-5 flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar productos por categoría"
            >
              {CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id] ?? Package
                const active = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-primary/40 hover:bg-secondary/20'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {cat.label}
                    <span
                      className={cn(
                        'rounded-full px-1.5 text-[11px] font-bold',
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-stone-100 text-stone-500'
                      )}
                    >
                      {counts[cat.id] ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertTriangle className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  Algo salió mal
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  No pudimos cargar el catálogo. Revisa tu conexión e intenta
                  de nuevo.
                </p>
                <Button
                  onClick={() => void load()}
                  className="mt-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <RotateCcw aria-hidden="true" />
                  Reintentar
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <SearchX className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  No encontramos productos
                </h3>
                <p className="mt-1 max-w-sm text-sm text-stone-500">
                  {search
                    ? `Sin resultados para "${search}". Prueba otra palabra o pídelo directamente por WhatsApp.`
                    : 'No hay productos en esta categoría por ahora.'}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="rounded-full border-stone-300"
                  >
                    <RotateCcw aria-hidden="true" />
                    Reiniciar búsqueda
                  </Button>
                  <Button
                    asChild
                    className="rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5d]"
                  >
                    <a
                      href={whatsappChatLink(
                        `Hola 3D PIXEL, busco "${search || 'un tomatodo'}" en su tienda. ¿Tienen disponibilidad?`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle aria-hidden="true" />
                      Pídelo por WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isAdmin={isAdmin}
                    onEdit={openEditProduct}
                    onDelete={setDeletingProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer onSelectCategory={handleSelectCategory} />
      <CartSheet />
      <FloatingWhatsApp />

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={handleLoginSuccess}
      />
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSaved={() => void load()}
      />

      <AlertDialog
        open={deletingProduct !== null}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deletingProduct?.name}&quot; y su foto
              permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
