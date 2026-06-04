"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetWarehouses, useGetOutlets } from "@/features/(erp-core)/locations/api/locations"
import { useCreateOrder } from "@/features/(erp-core)/orders/api/v1-orders"
import { Plus, Trash2 } from "lucide-react"

type LineItem = { variantId: string; quantity: string; unitPrice: string; discount: string }

function formatMoney(paisa: number) {
  return (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })
}

export default function CreateOrderPage() {
  const router = useRouter()
  const { data: warehouses = [] } = useGetWarehouses()
  const { data: outlets = [] } = useGetOutlets()
  const { mutate: create, isPending } = useCreateOrder()

  const allLocations = [...warehouses, ...outlets]

  const [locationId, setLocationId] = useState("")
  const [source, setSource] = useState<'MANUAL' | 'WEBSITE' | 'FUNNEL' | 'API'>('MANUAL')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'BANK' | 'WALLET' | ''>('')
  const [notes, setNotes] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [discount, setDiscount] = useState("0")
  const [tax, setTax] = useState("0")
  const [shippingCost, setShippingCost] = useState("0")

  // Address
  const [addrName, setAddrName] = useState("")
  const [addrPhone, setAddrPhone] = useState("")
  const [addrLine, setAddrLine] = useState("")
  const [addrArea, setAddrArea] = useState("")
  const [addrCity, setAddrCity] = useState("")

  const [lines, setLines] = useState<LineItem[]>([{ variantId: "", quantity: "", unitPrice: "", discount: "0" }])

  function updateLine(idx: number, field: keyof LineItem, value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const validLines = lines.filter(l => l.variantId && l.quantity && l.unitPrice)
  const subtotal = validLines.reduce((sum, l) => {
    const qty = parseInt(l.quantity || "0")
    const price = parseInt(l.unitPrice || "0")
    const disc = parseInt(l.discount || "0")
    return sum + qty * price - disc
  }, 0)
  const taxVal = parseInt(tax || "0")
  const discountVal = parseInt(discount || "0")
  const shippingVal = parseInt(shippingCost || "0")
  const grandTotal = subtotal + taxVal + shippingVal - discountVal

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!locationId || !validLines.length || !addrName || !addrPhone || !addrLine || !addrCity) return

    create(
      {
        locationId,
        source,
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
        customerNotes: customerNotes || undefined,
        discount: discountVal,
        tax: taxVal,
        shippingCost: shippingVal,
        address: { name: addrName, phone: addrPhone, address: addrLine, area: addrArea || undefined, city: addrCity },
        items: validLines.map(l => ({
          variantId: l.variantId,
          quantity: parseInt(l.quantity),
          unitPrice: parseInt(l.unitPrice),
          discount: parseInt(l.discount || "0"),
        })),
      },
      { onSuccess: () => router.push('/dashboard/orders') },
    )
  }

  return (
    <PageShell>
      <PageHeader title="New Order" description="Create a manual order. Inventory will be reserved immediately." />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Order Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Fulfillment Location *</label>
                <Select value={locationId} onValueChange={(v) => setLocationId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {allLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Source</label>
                <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="FUNNEL">Funnel</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Payment Method</label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                  <SelectTrigger><SelectValue placeholder="Select method (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="BKASH">bKash</SelectItem>
                    <SelectItem value="NAGAD">Nagad</SelectItem>
                    <SelectItem value="SSLCOMMERZ">SSLCommerz</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="WALLET">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Staff Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes" />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Customer Notes</label>
                <Textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={2} placeholder="Notes from customer" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Delivery Address</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={addrName} onChange={(e) => setAddrName(e.target.value)} placeholder="Customer name *" required />
                <Input value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} placeholder="Phone *" required />
                <Input value={addrLine} onChange={(e) => setAddrLine(e.target.value)} placeholder="Address line *" required />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={addrArea} onChange={(e) => setAddrArea(e.target.value)} placeholder="Area" />
                  <Input value={addrCity} onChange={(e) => setAddrCity(e.target.value)} placeholder="City *" required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Totals (paisa)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Tax</label>
                    <Input type="number" min={0} value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Discount</label>
                    <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Shipping</label>
                    <Input type="number" min={0} value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{formatMoney(subtotal)}</span></div>
                  {taxVal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>৳{formatMoney(taxVal)}</span></div>}
                  {shippingVal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>৳{formatMoney(shippingVal)}</span></div>}
                  {discountVal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-৳{formatMoney(discountVal)}</span></div>}
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Grand Total</span><span>৳{formatMoney(grandTotal)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[1fr_70px_110px_90px_36px] gap-2 text-xs text-muted-foreground px-1">
              <span>Variant ID</span><span>Qty</span><span>Unit Price (paisa)</span><span>Discount</span><span />
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_70px_110px_90px_36px] gap-2 items-start">
                <Input
                  value={line.variantId}
                  onChange={(e) => updateLine(idx, "variantId", e.target.value)}
                  placeholder="Variant ID"
                  className="font-mono text-xs"
                />
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                  placeholder="1"
                />
                <Input
                  type="number"
                  min={0}
                  value={line.unitPrice}
                  onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                  placeholder="0"
                />
                <Input
                  type="number"
                  min={0}
                  value={line.discount}
                  onChange={(e) => updateLine(idx, "discount", e.target.value)}
                  placeholder="0"
                />
                {lines.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                ) : <div />}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines(prev => [...prev, { variantId: "", quantity: "", unitPrice: "", discount: "0" }])} className="gap-1.5 w-full">
              <Plus className="w-3.5 h-3.5" />Add Item
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending || !locationId || !validLines.length || !addrName || !addrPhone || !addrLine || !addrCity}
          >
            {isPending ? "Creating…" : "Create Order"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </PageShell>
  )
}
