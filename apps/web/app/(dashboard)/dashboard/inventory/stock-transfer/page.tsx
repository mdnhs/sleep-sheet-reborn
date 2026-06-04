"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetWarehouses, useGetOutlets } from "@/features/(erp-core)/locations/api/locations"
import {
  useListTransfers,
  useGetTransfer,
  useCreateTransfer,
  useApproveTransfer,
  useReceiveTransfer,
  useCancelTransfer,
  type Transfer,
  type TransferStatus,
} from "@/features/(erp-core)/inventory-v1/api/inventory"
import { ArrowRightLeft, Plus, Trash2, CheckCircle, PackageCheck, XCircle } from "lucide-react"
import { format } from "date-fns"

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<TransferStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  APPROVED: "default",
  IN_TRANSIT: "default",
  RECEIVED: "outline",
  CANCELLED: "destructive",
}

function StatusBadge({ status }: { status: TransferStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
}

// ── Transfer detail panel ─────────────────────────────────────────────────────

function TransferDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useGetTransfer(id)
  const { mutate: approve, isPending: approving } = useApproveTransfer()
  const { mutate: receive, isPending: receiving } = useReceiveTransfer()
  const { mutate: cancel, isPending: cancelling } = useCancelTransfer()

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
  if (!data) return <p className="text-sm text-muted-foreground">Transfer not found.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-mono">{data.id}</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={data.status} />
            <span className="text-sm text-muted-foreground">
              {format(new Date(data.createdAt), "MMM d, yyyy HH:mm")}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">From</p>
          <p className="font-mono text-xs">{data.fromLocationId}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">To</p>
          <p className="font-mono text-xs">{data.toLocationId}</p>
        </div>
        {data.approvedBy && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Approved by</p>
            <p className="font-mono text-xs">{data.approvedBy}</p>
          </div>
        )}
        {data.receivedBy && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Received by</p>
            <p className="font-mono text-xs">{data.receivedBy}</p>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead className="text-right">Qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">{item.variantId.slice(0, 12)}…</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(data.status === 'DRAFT' || data.status === 'APPROVED' || data.status === 'IN_TRANSIT') && (
        <div className="flex gap-2 pt-2">
          {data.status === 'DRAFT' && (
            <Button size="sm" onClick={() => approve(id)} disabled={approving} className="gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {approving ? "Approving…" : "Approve"}
            </Button>
          )}
          {(data.status === 'APPROVED' || data.status === 'IN_TRANSIT') && (
            <Button size="sm" onClick={() => receive(id)} disabled={receiving} className="gap-1.5">
              <PackageCheck className="w-4 h-4" />
              {receiving ? "Receiving…" : "Mark Received"}
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => cancel(id)} disabled={cancelling} className="gap-1.5">
            <XCircle className="w-4 h-4" />
            {cancelling ? "Cancelling…" : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Transfer list ─────────────────────────────────────────────────────────────

function TransferList({
  status,
  onSelect,
  selectedId,
  warehouses,
  outlets,
}: {
  status?: TransferStatus
  onSelect: (id: string) => void
  selectedId: string | null
  warehouses: Array<{ id: string; name: string; code: string }>
  outlets: Array<{ id: string; name: string; code: string }>
}) {
  const allLocations = [...warehouses, ...outlets]
  const locationName = (id: string) => allLocations.find((l) => l.id === id)?.name ?? id.slice(0, 8) + "…"

  const { data: transfers = [], isLoading } = useListTransfers(status)

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
  if (!transfers.length) return <p className="text-center text-sm text-muted-foreground py-10">No transfers.</p>

  return (
    <div className="space-y-2">
      {transfers.map((t: Transfer) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors ${selectedId === t.id ? "border-primary bg-accent" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{locationName(t.fromLocationId)}</span>
              <span className="text-muted-foreground">→</span>
              <span>{locationName(t.toLocationId)}</span>
            </div>
            <StatusBadge status={t.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(t.createdAt), "MMM d, yyyy HH:mm")}</p>
        </button>
      ))}
    </div>
  )
}

// ── Create transfer form ──────────────────────────────────────────────────────

type LineItem = { variantId: string; quantity: string }

function CreateTransferForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { data: warehouses = [] } = useGetWarehouses()
  const { data: outlets = [] } = useGetOutlets()
  const allLocations = [...warehouses, ...outlets]

  const { mutate: create, isPending } = useCreateTransfer()

  const [fromLocationId, setFromLocationId] = useState("")
  const [toLocationId, setToLocationId] = useState("")
  const [lines, setLines] = useState<LineItem[]>([{ variantId: "", quantity: "" }])

  function updateLine(idx: number, field: keyof LineItem, value: string) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function addLine() {
    setLines((prev) => [...prev, { variantId: "", quantity: "" }])
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const items = lines
      .filter((l) => l.variantId && l.quantity)
      .map((l) => ({ variantId: l.variantId, quantity: parseInt(l.quantity) }))
    if (!fromLocationId || !toLocationId || !items.length) return

    create(
      { fromLocationId, toLocationId, items },
      {
        onSuccess: (t) => {
          onCreated(t.id)
          setFromLocationId("")
          setToLocationId("")
          setLines([{ variantId: "", quantity: "" }])
        },
      },
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">From Location</label>
        <Select value={fromLocationId} onValueChange={(v) => setFromLocationId(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
          <SelectContent>
            {allLocations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name} ({l.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">To Location</label>
        <Select value={toLocationId} onValueChange={(v) => setToLocationId(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
          <SelectContent>
            {allLocations.filter((l) => l.id !== fromLocationId).map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name} ({l.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Items</label>
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <div className="flex-1 space-y-0.5">
              <Input
                placeholder="Variant ID"
                value={line.variantId}
                onChange={(e) => updateLine(idx, "variantId", e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>
            <Input
              type="number"
              min={1}
              placeholder="Qty"
              value={line.quantity}
              onChange={(e) => updateLine(idx, "quantity", e.target.value)}
              required
              className="w-20"
            />
            {lines.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5 w-full">
          <Plus className="w-3.5 h-3.5" />Add Item
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating…" : "Create Transfer"}
      </Button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUS_TABS: Array<{ value: string; label: string; status?: TransferStatus }> = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft", status: "DRAFT" },
  { value: "APPROVED", label: "Approved", status: "APPROVED" },
  { value: "RECEIVED", label: "Received", status: "RECEIVED" },
  { value: "CANCELLED", label: "Cancelled", status: "CANCELLED" },
]

export default function StockTransferPage() {
  const { data: warehouses = [] } = useGetWarehouses()
  const { data: outlets = [] } = useGetOutlets()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <PageShell>
      <PageHeader title="Stock Transfer" description="Move inventory between locations. Approve then receive to update stock." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="w-4 h-4" />New Transfer</CardTitle></CardHeader>
          <CardContent>
            <CreateTransferForm onCreated={(id) => setSelectedId(id)} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selectedId && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ArrowRightLeft className="w-4 h-4" />Transfer Detail</CardTitle></CardHeader>
              <CardContent>
                <TransferDetail id={selectedId} onClose={() => setSelectedId(null)} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Transfers</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  {STATUS_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                  ))}
                </TabsList>
                {STATUS_TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value}>
                    <TransferList
                      status={t.status}
                      onSelect={setSelectedId}
                      selectedId={selectedId}
                      warehouses={warehouses}
                      outlets={outlets}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
