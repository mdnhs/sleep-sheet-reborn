"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  useListPurchaseReturns,
  useGetPurchaseReturn,
  useCreatePurchaseReturn,
  useApprovePurchaseReturn,
  useCancelPurchaseReturn,
  useListPurchaseOrders,
  useGetPurchaseOrder,
  type PurchaseReturn,
  type PRStatus,
} from "@/features/(erp-core)/purchases/api/purchases"
import { CheckCircle, XCircle, Eye, RotateCcw } from "lucide-react"
import { format } from "date-fns"

const STATUS_VARIANT: Record<PRStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "outline",
  CANCELLED: "destructive",
}

function StatusBadge({ status }: { status: PRStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
}

// ─── Create Return Dialog ─────────────────────────────────────────────────────

function CreateReturnDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [selectedPoId, setSelectedPoId] = useState("")
  const [notes, setNotes] = useState("")
  const [qtys, setQtys] = useState<Record<string, string>>({})

  const { data: orders = [] } = useListPurchaseOrders()
  const returnableOrders = orders.filter(o => ['RECEIVED', 'PARTIALLY_RECEIVED', 'COMPLETED'].includes(o.status))
  const { data: selectedPo } = useGetPurchaseOrder(selectedPoId)
  const { mutate: create, isPending } = useCreatePurchaseReturn()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPoId || !selectedPo) return

    const items = (selectedPo.items ?? [])
      .filter(item => qtys[item.id] && parseInt(qtys[item.id]) > 0)
      .map(item => ({
        purchaseItemId: item.id,
        variantId: item.variantId,
        quantity: parseInt(qtys[item.id]),
      }))

    if (!items.length) return

    create(
      { purchaseOrderId: selectedPoId, items, notes: notes || undefined },
      {
        onSuccess: () => {
          setOpen(false)
          setSelectedPoId("")
          setNotes("")
          setQtys({})
          onCreated?.()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-1.5"><RotateCcw className="w-4 h-4" />New Return</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Return</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Purchase Order</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={selectedPoId}
              onChange={(e) => { setSelectedPoId(e.target.value); setQtys({}) }}
            >
              <option value="">Select a received order…</option>
              {returnableOrders.map(o => (
                <option key={o.id} value={o.id}>{o.purchaseNumber} — ৳{(o.grandTotal / 100).toLocaleString()}</option>
              ))}
            </select>
          </div>

          {selectedPo && (
            <div className="space-y-1.5">
              <Label>Return Quantities</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Return Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedPo.items ?? []).map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.variantId.slice(0, 12)}…</TableCell>
                      <TableCell className="text-right">{item.receivedQuantity}</TableCell>
                      <TableCell className="text-right">৳{(item.unitCost / 100).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={item.receivedQuantity}
                          value={qtys[item.id] ?? ""}
                          onChange={(e) => setQtys(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-20 text-right"
                          placeholder="0"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for return…" rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !selectedPoId}>
              {isPending ? "Creating…" : "Create Return"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Return Detail Panel ──────────────────────────────────────────────────────

function ReturnDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: ret, isLoading } = useGetPurchaseReturn(id)
  const { mutate: approve, isPending: approving } = useApprovePurchaseReturn()
  const { mutate: cancel, isPending: cancelling } = useCancelPurchaseReturn()

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
  if (!ret) return <p className="text-sm text-muted-foreground">Return not found.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{ret.returnNumber}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={ret.status} />
            <span className="text-xs text-muted-foreground">{format(new Date(ret.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      {ret.notes && <p className="text-sm text-muted-foreground">{ret.notes}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(ret.items ?? []).map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">{item.variantId.slice(0, 12)}…</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">৳{(item.unitCost / 100).toLocaleString()}</TableCell>
              <TableCell className="text-right">৳{((item.quantity * item.unitCost) / 100).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {ret.status === 'PENDING' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => approve(ret.id)} disabled={approving} className="gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {approving ? "Approving…" : "Approve & Deduct Inventory"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => cancel(ret.id)} disabled={cancelling} className="gap-1.5">
            <XCircle className="w-4 h-4" />
            {cancelling ? "Cancelling…" : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Return List ──────────────────────────────────────────────────────────────

const STATUS_TABS: Array<{ value: string; label: string; status?: PRStatus }> = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending", status: "PENDING" },
  { value: "APPROVED", label: "Approved", status: "APPROVED" },
  { value: "CANCELLED", label: "Cancelled", status: "CANCELLED" },
]

function ReturnList({ status, onSelect, selectedId }: {
  status?: PRStatus
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  const { data: returns = [], isLoading } = useListPurchaseReturns(undefined, status)

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
  if (!returns.length) return <p className="text-center text-sm text-muted-foreground py-10">No returns.</p>

  return (
    <div className="space-y-2">
      {returns.map((ret: PurchaseReturn) => (
        <button
          key={ret.id}
          onClick={() => onSelect(ret.id)}
          className={`w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors ${selectedId === ret.id ? "border-primary bg-accent" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{ret.returnNumber}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(ret.createdAt), "MMM d, yyyy")}</p>
            </div>
            <StatusBadge status={ret.status} />
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchaseReturnsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <PageShell>
      <PageHeader title="Purchase Returns" description="Return goods to supplier. Approve to deduct inventory.">
        <CreateReturnDialog />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Returns</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  {STATUS_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                  ))}
                </TabsList>
                {STATUS_TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value}>
                    <ReturnList status={t.status} onSelect={setSelectedId} selectedId={selectedId} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="w-4 h-4" />Return Detail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReturnDetail id={selectedId} onClose={() => setSelectedId(null)} />
              </CardContent>
            </Card>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
              <p className="text-sm text-muted-foreground">Select a return to view details</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
