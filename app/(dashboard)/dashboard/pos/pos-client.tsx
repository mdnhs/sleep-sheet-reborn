"use client"
import { useEffect, useState, useCallback } from "react"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Receipt, X, Package, Loader2, ChevronLeft, ChevronRight, ListFilter, ShoppingCart, ChevronUp, ArrowUpCircle, Tag, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/hooks/use-currency"
import { useSettings } from "@/features/settings/api/use-settings"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface POSProduct {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  images: string[]
  colors: { name: string; price: number | null }[]
  sizes: string[]
  category: string
  categoryLabel: string
  discount?: number
  defaultVariantName?: string
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  size: string | null
  color: string | null
  image: string
  stock: number
  costPrice?: number
}

interface Category {
  id: string
  label: string
  value: string
}

export default function PosClientPage() {
  const router = useRouter()
  const { data: settings } = useSettings()
  const [products, setProducts] = useState<POSProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter_] = useState("all")
  const [priceFilter, setPriceFilter_] = useState("")
  const [sortFilter, setSortFilter_] = useState("featured")
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const setCategoryFilter = (v: string) => { setCategoryFilter_(v) }
  const setPriceFilter = (v: string) => { setPriceFilter_(v) }
  const setSortFilter = (v: string) => { setSortFilter_(v) }

  const PRICE_RANGES = [
    { value: "under-50", label: "Under ৳50" },
    { value: "50-100", label: "৳50–100" },
    { value: "100-200", label: "৳100–200" },
    { value: "200+", label: "৳200+" },
  ]

  const SORT_OPTIONS = [
    { value: "featured", label: "Featured" },
    { value: "price-asc", label: "Low to High" },
    { value: "price-desc", label: "High to Low" },
  ]

  const customMethods: { label: string; value: string }[] = settings?.pos_payment_methods
    ? JSON.parse(settings.pos_payment_methods)
    : []

  const paymentMethods = [
    { value: "COD", label: "Cash", icon: Banknote, enabled: settings ? settings.payment_method_cod !== "false" : true },
    { value: "CARD", label: "Card", icon: CreditCard, enabled: settings ? settings.payment_method_card !== "false" : true },
    { value: "DUE", label: "Due", icon: Receipt, enabled: settings ? settings.payment_method_due !== "false" : true },
    ...customMethods.map(m => ({ value: m.value, label: m.label, icon: Banknote, enabled: true })),
  ]
  const enabledMethods = paymentMethods.filter(m => m.enabled)
  const [totalPages, setTotalPages] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [shippingType, setShippingType] = useState<"showroom" | "online">("online")
  const [paymentMethod, setPaymentMethod_] = useState("COD")
  const setPaymentMethod = (v: string) => { setPaymentMethod_(v) }
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<{ id: string; orderNumber: string; totalAmount: number } | null>(null)

  useEffect(() => {
    if (settings && !enabledMethods.find(m => m.value === paymentMethod)) {
      setPaymentMethod(enabledMethods[0]?.value || "COD")
    }
  }, [settings, enabledMethods])

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (categoryFilter !== "all") params.set("category", categoryFilter)
      if (priceFilter) params.set("price", priceFilter)
      if (sortFilter) params.set("sort", sortFilter)
      params.set("page", page.toString())
      params.set("limit", "20")

      const res = await fetch(`/api/products?${params}`)
      const json = await res.json()
      if (json.data) {
        setProducts(json.data)
        setTotalPages(json.totalPages || 1)
      }
    } catch (error) {
      console.error("Failed to fetch products", error)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, categoryFilter, priceFilter, sortFilter, page])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      const json = await res.json()
      if (Array.isArray(json)) setCategories(json)
    } catch (error) {
      console.error("Failed to fetch categories", error)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const addToCart = (product: POSProduct, variant?: { name: string; price: number | null }, size?: string, costPrice?: number) => {
    setCart(prev => {
      const price = variant?.price ?? product.price
      const color = variant?.name || null
      const existing = prev.find(
        i => i.productId === product.id && i.color === color && i.size === (size || null) && i.costPrice === costPrice
      )

      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Insufficient stock")
          return prev
        }
        return prev.map(i =>
          i.productId === product.id && i.color === color && i.size === (size || null) && i.costPrice === costPrice
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }

      return [...prev, {
        productId: product.id,
        name: product.name,
        price,
        quantity: 1,
        size: size || null,
        color,
        image: product.images?.[0] || "",
        stock: product.stock,
        costPrice,
      }]
    })
  }

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const item = prev[index]
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) return prev.filter((_, i) => i !== index)
      if (newQty > item.stock) {
        toast.error("Insufficient stock")
        return prev
      }
      return prev.map((i, idx) => idx === index ? { ...i, quantity: newQty } : i)
    })
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0)

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required")
      return
    }
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    setIsCheckingOut(true)
    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
          shippingType,
          paymentMethod,
          items: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            costPrice: i.costPrice,
            size: i.size || undefined,
            color: i.color || undefined,
          })),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Checkout failed")
        setIsCheckingOut(false)
        return
      }

      setLastOrder(json.order)
      setCheckoutSuccess(true)
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setReference("")
      setNote("")
      setShippingType("online")
      toast.success("Order placed successfully!")
    } catch (error) {
      toast.error("Failed to place order")
    } finally {
      setIsCheckingOut(false)
    }
  }

  const newSale = () => {
    setCheckoutSuccess(false)
    setLastOrder(null)
  }

  if (checkoutSuccess && lastOrder) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Receipt className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Sale Complete</h1>
          <div className="bg-muted rounded-xl p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-xl font-mono font-bold">{lastOrder.orderNumber}</p>
            <div className="h-px bg-border my-3" />
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold">৳{lastOrder.totalAmount.toLocaleString()}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={newSale}>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
            <Button variant="outline" onClick={() => router.push(`/dashboard/orders`)}>
              View Orders
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderCartContents = () => (
    <>
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Current Sale
          {cart.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({cart.length} item{cart.length !== 1 ? "s" : ""})
            </span>
          )}
        </h2>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Package className="h-10 w-10 mb-2" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs">Select products to start a sale</p>
          </div>
        ) : (
          cart.map((item, index) => (
            <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3 p-3 rounded-xl bg-muted/50 border">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                    No img
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}
                {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                <p className="text-sm font-semibold mt-1">৳{item.price.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeFromCart(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(index, -1)}
                    className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, 1)}
                    className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer & Checkout */}
      {cart.length > 0 && (
        <div className="border-t p-4 space-y-3 shrink-0 bg-background">
          <div className="space-y-2">
            <Input
              placeholder="Customer name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <Input
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              type="tel"
            />
            <Input
              placeholder="Reference (optional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <textarea
              placeholder="Notes (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={shippingType === "online" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setShippingType("online")}
            >
              Online
            </Button>
            <Button
              variant={shippingType === "showroom" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setShippingType("showroom")}
            >
              Showroom
            </Button>
          </div>

          <div className="flex gap-2">
            {enabledMethods.map(m => (
              <Button
                key={m.value}
                variant={paymentMethod === m.value ? "default" : "outline"}
                size="sm"
                className={`flex-1 gap-1.5 ${paymentMethod === m.value && m.value === "DUE" ? "bg-orange-600 hover:bg-orange-700 border-orange-600 text-white" : paymentMethod === m.value && !["COD","CARD","DUE"].includes(m.value) ? "bg-foreground text-background" : ""}`}
                onClick={() => setPaymentMethod(m.value)}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-bold">৳{subtotal.toLocaleString()}</span>
            </div>
          </div>

          <Button
            className="w-full h-11 text-base gap-2"
            onClick={handleCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isCheckingOut ? "Processing..." : `Complete Sale — ৳${subtotal.toLocaleString()}`}
          </Button>
        </div>
      )}
    </>
  )

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] gap-0 relative">
      {/* Left Panel - Product Browser */}
      <div className="flex-1 flex flex-col lg:border-r overflow-hidden pb-16 lg:pb-0">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b bg-background space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Point of Sale</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto max-w-[420px] pb-1 scrollbar-none">
              <button
                onClick={() => { setCategoryFilter("all"); setPage(1) }}
                className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors font-medium ${
                  categoryFilter === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-border hover:border-foreground/50"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryFilter(cat.label); setPage(1) }}
                  className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors font-medium ${
                    categoryFilter === cat.label
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border hover:border-foreground/50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              className="rounded-xl shrink-0"
              onClick={() => setShowFilters(p => !p)}
            >
              <ListFilter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <>
              {/* Sort */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium mr-1">Sort:</span>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortFilter(opt.value)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${sortFilter === opt.value
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium mr-1">Price:</span>
                <button
                  onClick={() => setPriceFilter("")}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${!priceFilter
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-border hover:border-foreground/50"
                  }`}
                >
                  All
                </button>
                {PRICE_RANGES.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setPriceFilter(range.value)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${priceFilter === range.value
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Package className="h-12 w-12 mb-3" />
              <p>No products found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desktop Right Panel - Cart */}
      <div className="hidden lg:flex w-[400px] flex-col bg-background shrink-0">
        {renderCartContents()}
      </div>

      {/* Mobile Sticky Cart Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between md:left-64">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-muted-foreground">{cart.length} item(s)</span>
          <span className="text-lg font-bold text-foreground">৳{subtotal.toLocaleString()}</span>
        </div>
        <Sheet>
          <SheetTrigger
            render={
              <Button size="lg" className="px-8 shadow-sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
              </Button>
            }
          />
          <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col rounded-t-xl overflow-hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            {renderCartContents()}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onAdd,
}: {
  product: POSProduct
  onAdd: (product: POSProduct, variant?: { name: string; price: number | null }, size?: string, costPrice?: number) => void
}) {
  const { formatAmount } = useCurrency()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "")
  const [selectedColor, setSelectedColor] = useState(product.defaultVariantName || product.colors?.[0]?.name || "")
  const [quantity, setQuantity] = useState(1)
  const [costPrice, setCostPrice] = useState("")

  const hasColors = product.colors && product.colors.length > 0
  const hasSizes = product.sizes && product.sizes.length > 0
  const hasVariants = hasColors || hasSizes

  const currentVariant = product.colors?.find(c => c.name === selectedColor)
  const displayPrice = currentVariant && (currentVariant.price !== null && currentVariant.price !== undefined)
    ? currentVariant.price
    : product.price

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) { toast.error("Please select a size"); return }
    if (hasColors && !selectedColor) { toast.error("Please select a variant"); return }
    if (isDrawerOpen && costPrice !== "" && isNaN(Number(costPrice))) { toast.error("Bought price must be a number"); return }
    const variant = currentVariant || undefined
    const size = hasSizes ? selectedSize : undefined
    const parsedCostPrice = costPrice !== "" ? Number(costPrice) : undefined
    onAdd(product, variant, size, parsedCostPrice)
    setIsDrawerOpen(false)
    setCostPrice("")
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDrawerOpen(true)
  }

  const updateQuantity = (e: React.MouseEvent, delta: number) => {
    e.preventDefault()
    e.stopPropagation()
    setQuantity(Math.max(1, quantity + delta))
  }

  return (
    <div className="group relative w-full h-full flex flex-col rounded-3xl bg-white dark:bg-slate-900 p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Product Image */}
      <div className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-[#f4f4f5] dark:bg-slate-800 mb-4 shrink-0 z-0">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={`h-full w-full object-cover transition-all duration-700 ${isDrawerOpen ? 'blur-md scale-110 opacity-40' : 'group-hover:scale-105'}`}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Package className="h-8 w-8" />
          </div>
        )}

        {/* Top actions: Discount tag + Stock badge */}
        <div className="absolute top-3 left-3 flex justify-between items-start z-10 w-[calc(100%-24px)]">
          <div className="flex gap-2">
            {product.discount && product.discount > 0 ? (
              <div className="bg-[#1a1a1a] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="h-3 w-3 text-orange-400" /> {Math.round(product.discount)}% OFF
              </div>
            ) : null}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="bg-[#1a1a1a] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm">
                Only {product.stock} left
              </div>
            )}
          </div>
          <div />
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="text-white font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col px-1 flex-1 relative z-10 bg-white dark:bg-slate-900">
        {/* Title */}
        <div className="flex-1">
          <h3 className="font-medium text-sm sm:text-[15px] text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 mb-2 sm:mb-3">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            {product.discount && product.discount > 0 && (
              <span className="text-sm line-through text-slate-400 dark:text-slate-500 font-medium">
                {formatAmount(displayPrice / (1 - product.discount / 100))}
              </span>
            )}
            <p className="font-bold text-lg sm:text-[20px] text-slate-800 dark:text-slate-200">
              {formatAmount(displayPrice)}
            </p>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="flex-1 flex items-center justify-between bg-[#f4f4f5] dark:bg-slate-800 rounded-xl px-2 h-10 sm:h-12" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <button onClick={(e) => updateQuantity(e, -1)} className="p-1 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50" disabled={quantity <= 1}>
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">{quantity}</span>
            <button onClick={(e) => updateQuantity(e, 1)} className="p-1 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dialog for Variants */}
      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Options</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {hasSizes && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Size</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(size); }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasColors && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Variant</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors?.map((color) => (
                    <button
                      key={color.name}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(color.name); }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedColor === color.name
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {color.name} ({formatAmount(color.price !== null ? color.price : product.price)})
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Bought Price (Cost)</span>
              <Input 
                type="number"
                placeholder="0.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 w-full mt-4">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(); }}
              disabled={product.stock === 0 || (hasSizes && !selectedSize) || (hasColors && !selectedColor)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-3 sm:py-3.5 rounded-[14px] font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Button */}
      <div className="relative z-40 px-1 shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={handleActionClick}
          disabled={product.stock === 0}
          className="w-full flex items-center justify-between bg-primary text-primary-foreground hover:bg-primary/90 py-3 sm:py-3.5 px-4 sm:px-5 rounded-[14px] font-medium text-xs sm:text-[14px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Add to Cart</span>
          <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 opacity-80 rotate-90" />
        </button>
      </div>
    </div>
  )
}
