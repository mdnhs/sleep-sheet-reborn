"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useListPosReturns,
  useGetPosReturn,
  useApprovePosReturn,
  useCancelPosReturn,
  useListPosSales,
  useGetPosSale,
  useCreatePosReturn,
  type PosSaleReturn,
  type ReturnStatus,
  type PosSaleDetail,
} from "@/features/(erp-core)/pos/api/v1-pos"
import { format } from "date-fns"
import { CheckCircle, XCircle, Eye, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<ReturnStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  CANCELLED: "destructive",
}

function CreateReturnDialog() {
  const [open, setOpen] = useState(false)
  const [saleNumber, setSaleNumber] = useState("")
  const [foundSale, setFoundSale] = useState<PosSaleDetail | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState("")
  const [searching, setSearching] = useState(false)

  const { mutate: createReturn, isPending } = useCreatePosReturn()

  async function searchSale() {
    if (!saleNumber) return
    setSearching(true)
    try {
      const res = await fetch(`/api/v1/pos-sales?status=COMPLETED`)
      const json = await res.json() as { success: true; data: any[] }
      const sale = json.data.find((s: any) => s.saleNumber === saleNumber)
      if (sale) {
        const detailRes = await fetch(`/api/v1/pos-sales/${sale.id}`)
        const detail = await detailRes.json() as { success: true; data: PosSaleDetail }
        setFoundSale(detail.data)
      } else {
        setFoundSale(null)
      }
    } finally {
      setSearching(false)
    }
  }

  function submit() {
    if (!foundSale) return
    const items = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([saleItemId, quantity]) => {
        const item = foundSale.items.find(i => i.id === saleItemId)!
        return { saleItemId, variantId: item.variantId, quantity }
      })
    if (!items.length) return
    createReturn({ saleId: foundSale.id, items, notes: notes || undefined }, {
      onSuccess: () => {
        setOpen(false)
        setSaleNumber("")
        setFoundSale(null)
        setSelectedItems({})
        setNotes("")
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-1.5"><Plus className="w-4 h-4" />New Return</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create POS Return</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              placeholder="Sale number e.g. POS-000001"
              value={saleNumber}
              onChange={e => setSaleNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchSale()}
            />
            <Button variant="outline" onClick={searchSale} disabled={searching}>
              {searching ? "…" : "Find"}
            </Button>
          </div>

          {foundSale && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Sale</span><span className="font-mono font-medium">{foundSale.saleNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>৳{(foundSale.grandTotal / 100).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(foundSale.createdAt), "MMM d, yyyy")}</span></div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Return Items</p>
                {foundSale.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium font-mono text-xs truncate">{item.variantId.slice(0, 16)}…</p>
                      <p className="text-xs text-muted-foreground">Sold: {item.quantity} × ৳{(item.unitPrice / 100).toLocaleString()}</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={item.quantity}
                      className="w-20 h-8 text-sm"
                      value={selectedItems[item.id] ?? 0}
                      onChange={e => setSelectedItems(prev => ({ ...prev, [item.id]: Math.min(Number(e.target.value), item.quantity) }))}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Reason for return…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <Button
                className="w-full"
                disabled={isPending || !Object.values(selectedItems).some(q => q > 0)}
                onClick={submit}
              >
                {isPending ? "Creating…" : "Submit Return"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReturnDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: ret, isLoading } = useGetPosReturn(id)
  const { mutate: approve, isPending: approving } = useApprovePosReturn()
  const { mutate: cancel, isPending: cancelling } = useCancelPosReturn()

  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}</div>
  if (!ret) return <p className="text-sm text-muted-foreground">Return not found.</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold font-mono text-sm">{ret.returnNumber}</p>
          <Badge variant={STATUS_VARIANT[ret.status]}>{ret.status}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="text-sm space-y-1 border rounded-lg p-3">
        <p className="text-xs text-muted-foreground">Sale: <span className="font-mono text-foreground">{ret.saleId.slice(0, 16)}…</span></p>
        {ret.notes && <p className="text-muted-foreground">{ret.notes}</p>}
        <p className="text-xs text-muted-foreground">{format(new Date(ret.createdAt), "MMM d, yyyy HH:mm")}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</p>
        {ret.items.map(item => (
          <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
            <span className="font-mono text-xs">{item.variantId.slice(0, 16)}…</span>
            <span>×{item.quantity}</span>
          </div>
        ))}
      </div>

      {ret.status === 'PENDING' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="gap-1.5" onClick={() => approve(ret.id)} disabled={approving}>
            <CheckCircle className="w-3.5 h-3.5" />{approving ? "Approving…" : "Approve & Restore"}
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => cancel(ret.id)} disabled={cancelling}>
            <XCircle className="w-3.5 h-3.5" />{cancelling ? "…" : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  )
}

function ReturnList({ status, onSelect, selectedId }: {
  status?: ReturnStatus
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  const { data: returns = [], isLoading } = useListPosReturns(undefined, status)
  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
  if (!returns.length) return <p className="text-center text-sm text-muted-foreground py-8">No returns.</p>

  return (
    <div className="space-y-2">
      {returns.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={`w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors ${selectedId === r.id ? "border-primary bg-accent" : ""}`}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm font-mono">{r.returnNumber}</p>
            <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(r.createdAt), "MMM d, yyyy")}</p>
        </button>
      ))}
    </div>
  )
}

const TABS: Array<{ value: string; label: string; status?: ReturnStatus }> = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending", status: "PENDING" },
  { value: "APPROVED", label: "Approved", status: "APPROVED" },
  { value: "CANCELLED", label: "Cancelled", status: "CANCELLED" },
]

export default function ReturnSalePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <PageShell>
      <PageHeader title="POS Returns" description="Manage and approve POS sale returns.">
        <CreateReturnDialog />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Returns</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
                </TabsList>
                {TABS.map(t => (
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
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Eye className="w-4 h-4" />Return Detail</CardTitle></CardHeader>
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
