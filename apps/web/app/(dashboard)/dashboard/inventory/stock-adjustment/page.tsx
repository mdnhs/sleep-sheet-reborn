"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetWarehouses, useGetOutlets } from "@/features/(erp-core)/locations/api/locations"
import { useAdjustStock, useGetMovements } from "@/features/(erp-core)/inventory-v1/api/inventory"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SlidersHorizontal, ClipboardList } from "lucide-react"
import { format } from "date-fns"

export default function StockAdjustmentPage() {
  const { data: warehouses = [] } = useGetWarehouses()
  const { data: outlets = [] } = useGetOutlets()
  const { mutate: adjust, isPending } = useAdjustStock()
  const { data: movements = [], isLoading: movementsLoading } = useGetMovements(undefined, undefined)

  const allLocations = [...warehouses, ...outlets]

  const [variantId, setVariantId] = useState("")
  const [locationId, setLocationId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!variantId || !locationId || quantity === "") return
    adjust(
      { variantId, locationId, quantity: parseInt(quantity), notes: notes || undefined },
      { onSuccess: () => { setVariantId(""); setLocationId(""); setQuantity(""); setNotes("") } }
    )
  }

  const adjustmentMovements = movements.filter((m) => m.movementType === "ADJUSTMENT")

  return (
    <PageShell>
      <PageHeader title="Stock Adjustment" description="Correct inventory quantities. Every adjustment creates a movement record." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" />New Adjustment</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Variant ID</label>
                <Input placeholder="variant-id" value={variantId} onChange={(e) => setVariantId(e.target.value)} required />
                <p className="text-xs text-muted-foreground">Copy from the variant detail page.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Location</label>
                <Select value={locationId} onValueChange={(v) => setLocationId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {allLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">New Quantity (absolute)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Reason / Notes</label>
                <Textarea placeholder="e.g. Physical count correction" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Adjusting…" : "Apply Adjustment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="w-4 h-4" />Adjustment History</CardTitle></CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
              ) : adjustmentMovements.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No adjustments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Delta</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentMovements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">{m.variantId.slice(0, 8)}…</TableCell>
                        <TableCell className="font-mono text-xs">{m.locationId.slice(0, 8)}…</TableCell>
                        <TableCell className={m.quantity >= 0 ? "text-green-600" : "text-red-600"}>
                          {m.quantity >= 0 ? "+" : ""}{m.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.notes ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(m.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
