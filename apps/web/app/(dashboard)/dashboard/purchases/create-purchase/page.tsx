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
import { useListSuppliers } from "@/features/(erp-core)/suppliers/api/suppliers"
import { useGetWarehouses, useGetOutlets } from "@/features/(erp-core)/locations/api/locations"
import { useCreatePurchaseOrder } from "@/features/(erp-core)/purchases/api/purchases"
import { Plus, Trash2 } from "lucide-react"

type LineItem = { variantId: string; quantity: string; unitCost: string }

function formatMoney(paisa: number) {
  return (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })
}

export default function CreatePurchasePage() {
  const router = useRouter()
  const { data: suppliers = [] } = useListSuppliers('ACTIVE')
  const { data: warehouses = [] } = useGetWarehouses()
  const { data: outlets = [] } = useGetOutlets()
  const { mutate: create, isPending } = useCreatePurchaseOrder()

  const allLocations = [...warehouses, ...outlets]

  const [supplierId, setSupplierId] = useState("")
  const [locationId, setLocationId] = useState("")
  const [lines, setLines] = useState<LineItem[]>([{ variantId: "", quantity: "", unitCost: "" }])
  const [tax, setTax] = useState("0")
  const [discount, setDiscount] = useState("0")
  const [notes, setNotes] = useState("")

  function updateLine(idx: number, field: keyof LineItem, value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function addLine() {
    setLines(prev => [...prev, { variantId: "", quantity: "", unitCost: "" }])
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  const validLines = lines.filter(l => l.variantId && l.quantity && l.unitCost)
  const subtotal = validLines.reduce((sum, l) => sum + parseInt(l.quantity || "0") * parseInt(l.unitCost || "0"), 0)
  const taxVal = parseInt(tax || "0")
  const discountVal = parseInt(discount || "0")
  const grandTotal = subtotal + taxVal - discountVal

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || !locationId || !validLines.length) return

    const items = validLines.map(l => ({
      variantId: l.variantId,
      quantity: parseInt(l.quantity),
      unitCost: parseInt(l.unitCost),
    }))

    create(
      { supplierId, receivingLocationId: locationId, items, tax: taxVal, discount: discountVal, notes: notes || undefined },
      {
        onSuccess: (po) => {
          router.push(`/dashboard/purchases/purchase-orders`)
        },
      },
    )
  }

  return (
    <PageShell>
      <PageHeader title="New Purchase Order" description="Create a purchase order. Inventory updates only when goods are received." />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Order Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Supplier *</label>
                <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.phone}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Receiving Location *</label>
                <Select value={locationId} onValueChange={(v) => setLocationId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {allLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional order notes" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Totals (in paisa)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Tax (paisa)</label>
                <Input type="number" min={0} value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Discount (paisa)</label>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{formatMoney(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>৳{formatMoney(taxVal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-৳{formatMoney(discountVal)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>Grand Total</span><span>৳{formatMoney(grandTotal)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[1fr_80px_100px_40px] gap-2 text-xs text-muted-foreground px-1">
              <span>Variant ID</span><span>Quantity</span><span>Unit Cost (paisa)</span><span />
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 items-start">
                <Input
                  value={line.variantId}
                  onChange={(e) => updateLine(idx, "variantId", e.target.value)}
                  placeholder="Variant ID"
                  className="font-mono text-xs"
                  required
                />
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                  placeholder="1"
                  required
                />
                <Input
                  type="number"
                  min={0}
                  value={line.unitCost}
                  onChange={(e) => updateLine(idx, "unitCost", e.target.value)}
                  placeholder="0"
                  required
                />
                {lines.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                ) : <div />}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5 w-full">
              <Plus className="w-3.5 h-3.5" />Add Item
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !supplierId || !locationId || !validLines.length}>
            {isPending ? "Creating…" : "Create Purchase Order"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </PageShell>
  )
}
