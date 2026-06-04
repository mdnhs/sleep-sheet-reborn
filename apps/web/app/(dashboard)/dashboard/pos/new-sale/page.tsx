"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  useListRegisters,
  useListSessions,
  useCreatePosSale,
  useHoldPosSale,
  type PaymentMethod,
} from "@/features/(erp-core)/pos/api/v1-pos"
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Save } from "lucide-react"

type ApiOk<T> = { success: true; data: T }
type ProductVariant = { id: string; name: string; sku: string; barcode: string | null; price: number }
type ProductItem = { id: string; name: string; status: string; variants?: ProductVariant[] }
type CartItem = { variantId: string; variantName: string; productName: string; unitPrice: number; quantity: number; discount: number }

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK', 'WALLET']

function useSearchProducts(q: string) {
  return useQuery<ProductItem[]>({
    queryKey: ["v1", "products", "search", q],
    queryFn: async () => {
      const params = q ? `?search=${encodeURIComponent(q)}&status=ACTIVE` : `?status=ACTIVE`
      const res = await fetch(`/api/v1/products${params}`)
      if (!res.ok) throw new Error("Failed to search products")
      const json = await res.json() as ApiOk<{ items: ProductItem[] }> | ApiOk<ProductItem[]>
      const data = json.data
      return Array.isArray(data) ? data : (data as any).items ?? []
    },
    enabled: true,
  })
}

function useProductVariants(productId: string | null) {
  return useQuery<ProductVariant[]>({
    queryKey: ["v1", "products", productId, "variants"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products/${productId}/variants`)
      if (!res.ok) throw new Error("Failed to fetch variants")
      return (await res.json() as ApiOk<ProductVariant[]>).data
    },
    enabled: !!productId,
  })
}

function CartRow({ item, onQtyChange, onDiscountChange, onRemove }: {
  item: CartItem
  onQtyChange: (delta: number) => void
  onDiscountChange: (v: number) => void
  onRemove: () => void
}) {
  const lineTotal = item.quantity * item.unitPrice - item.discount
  return (
    <div className="flex gap-3 py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.productName}</p>
        <p className="text-xs text-muted-foreground">{item.variantName} — ৳{(item.unitPrice / 100).toLocaleString()}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => onQtyChange(-1)} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-accent">
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
          <button onClick={() => onQtyChange(1)} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-accent">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <p className="text-sm font-semibold">৳{(lineTotal / 100).toLocaleString()}</p>
        <button onClick={onRemove} className="text-destructive hover:text-destructive/80">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function NewSalePage() {
  const [sessionId, setSessionId] = useState("")
  const [search, setSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [notes, setNotes] = useState("")

  const { data: registers = [] } = useListRegisters()
  const activeSessions = useListSessions()
  const openSessions = (activeSessions.data ?? []).filter(s => s.status === 'OPEN')

  const { data: products = [], isLoading: searchLoading } = useSearchProducts(search)
  const { data: variants = [] } = useProductVariants(selectedProduct)

  const { mutate: createSale, isPending: selling } = useCreatePosSale()
  const { mutate: holdSale, isPending: holding } = useHoldPosSale()

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice - i.discount, 0)
  const grandTotal = subtotal + tax - discount
  const remaining = grandTotal - (Number(paymentAmount) || 0)

  function addToCart(variant: ProductVariant, productName: string) {
    setCart(prev => {
      const existing = prev.findIndex(i => i.variantId === variant.id)
      if (existing >= 0) {
        return prev.map((i, idx) => idx === existing ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        variantId: variant.id,
        variantName: variant.name,
        productName,
        unitPrice: variant.price,
        quantity: 1,
        discount: 0,
      }]
    })
    setSelectedProduct(null)
  }

  function updateQty(idx: number, delta: number) {
    setCart(prev => {
      const updated = [...prev]
      const newQty = updated[idx].quantity + delta
      if (newQty <= 0) return prev.filter((_, i) => i !== idx)
      updated[idx] = { ...updated[idx], quantity: newQty }
      return updated
    })
  }

  function checkout() {
    if (!sessionId || !cart.length) return
    const paid = Number(paymentAmount) || grandTotal
    createSale({
      sessionId,
      items: cart.map(i => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      payments: [{ method: paymentMethod, amount: paid }],
      discount,
      tax,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setCart([])
        setDiscount(0)
        setTax(0)
        setPaymentAmount("")
        setNotes("")
      },
    })
  }

  function hold() {
    if (!sessionId || !cart.length) return
    holdSale({
      sessionId,
      items: cart.map(i => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      discount,
      tax,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setCart([])
        setDiscount(0)
        setTax(0)
        setNotes("")
      },
    })
  }

  const hasActiveSession = !!sessionId

  return (
    <PageShell>
      <PageHeader title="New Sale" description="Create a POS sale. Requires an open register session." />

      {/* Session selector */}
      <div className="flex items-center gap-3 mb-4">
        <Label className="text-sm whitespace-nowrap">Active Session:</Label>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm flex-1 max-w-xs"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
        >
          <option value="">Select session…</option>
          {openSessions.map(s => {
            const reg = registers.find(r => r.id === s.cashRegisterId)
            return <option key={s.id} value={s.id}>{reg?.name ?? s.cashRegisterId} — opened {new Date(s.openedAt).toLocaleTimeString()}</option>
          })}
        </select>
        {!openSessions.length && (
          <p className="text-xs text-muted-foreground">No open sessions. <a href="/dashboard/pos/cash-register" className="underline">Open a register</a>.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: product search */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" />Search Products</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search by name or SKU…"
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedProduct(null) }}
              />
              {searchLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
              ) : products.length > 0 ? (
                <div className="space-y-1 max-h-[240px] overflow-y-auto">
                  {products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(selectedProduct === p.id ? null : p.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors ${selectedProduct === p.id ? 'border-primary bg-accent' : ''}`}
                      disabled={!hasActiveSession}
                    >
                      <span className="font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              ) : search ? (
                <p className="text-sm text-muted-foreground text-center py-4">No products found.</p>
              ) : null}

              {selectedProduct && variants.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Variant</p>
                  <div className="grid grid-cols-2 gap-2">
                    {variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          const product = products.find(p => p.id === selectedProduct)
                          if (product) addToCart(v, product.name)
                        }}
                        className="text-left border rounded-lg px-3 py-2 hover:bg-accent hover:border-primary transition-colors text-sm"
                      >
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">৳{(v.price / 100).toLocaleString()} · {v.sku}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />Cart
                {cart.length > 0 && <Badge variant="secondary">{cart.length} items</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!cart.length ? (
                <p className="text-sm text-center text-muted-foreground py-8">Cart is empty. Search and add products above.</p>
              ) : (
                <div className="space-y-0">
                  {cart.map((item, idx) => (
                    <CartRow
                      key={item.variantId}
                      item={item}
                      onQtyChange={delta => updateQty(idx, delta)}
                      onDiscountChange={v => setCart(prev => prev.map((i, ii) => ii === idx ? { ...i, discount: v } : i))}
                      onRemove={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: totals + payment */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Order Total</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{(subtotal / 100).toLocaleString()}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Discount</span>
                  <Input
                    type="number"
                    min="0"
                    className="w-24 h-7 text-right text-sm"
                    value={discount / 100}
                    onChange={e => setDiscount(Math.round(Number(e.target.value) * 100))}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tax</span>
                  <Input
                    type="number"
                    min="0"
                    className="w-24 h-7 text-right text-sm"
                    value={tax / 100}
                    onChange={e => setTax(Math.round(Number(e.target.value) * 100))}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>৳{(grandTotal / 100).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Method</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${paymentMethod === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={`${(grandTotal / 100).toLocaleString()}`}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                />
                {paymentAmount && remaining !== 0 && (
                  <p className={`text-xs ${remaining > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {remaining > 0 ? `Short ৳${(remaining / 100).toLocaleString()}` : `Change ৳${(-remaining / 100).toLocaleString()}`}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Notes (optional)</Label>
                <Input placeholder="…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="w-full gap-1.5"
              size="lg"
              disabled={!hasActiveSession || !cart.length || selling || (!!paymentAmount && remaining !== 0)}
              onClick={checkout}
            >
              <CheckCircle className="w-4 h-4" />
              {selling ? "Processing…" : `Checkout — ৳${(grandTotal / 100).toLocaleString()}`}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-1.5"
              disabled={!hasActiveSession || !cart.length || holding}
              onClick={hold}
            >
              <Save className="w-4 h-4" />
              {holding ? "Saving…" : "Hold Sale"}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
