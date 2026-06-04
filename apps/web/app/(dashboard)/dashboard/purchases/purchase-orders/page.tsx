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
import { useListPurchaseOrders, useApprovePurchaseOrder, useCancelPurchaseOrder, useGetPurchaseOrder, useReceivePurchaseOrder, type PurchaseOrder, type POStatus } from "@/features/(erp-core)/purchases/api/purchases"
import { useListSuppliers } from "@/features/(erp-core)/suppliers/api/suppliers"
import { CheckCircle, XCircle, PackageCheck, Eye } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

const STATUS_VARIANT: Record<POStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  APPROVED: "default",
  PARTIALLY_RECEIVED: "default",
  RECEIVED: "outline",
  COMPLETED: "outline",
  CANCELLED: "destructive",
}

function StatusBadge({ status }: { status: POStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>
}

function PODetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: po, isLoading } = useGetPurchaseOrder(id)
  const { mutate: approve, isPending: approving } = useApprovePurchaseOrder()
  const { mutate: cancel, isPending: cancelling } = useCancelPurchaseOrder()
  const { mutate: receive, isPending: receiving } = useReceivePurchaseOrder()

  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({})

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
  if (!po) return <p className="text-sm text-muted-foreground">Order not found.</p>

  function handleReceive() {
    const items = (po!.items ?? [])
      .filter(item => receiveQtys[item.id] && parseInt(receiveQtys[item.id]) > 0)
      .map(item => ({ itemId: item.id, receivedQty: parseInt(receiveQtys[item.id]) }))
    if (!items.length) return
    receive({ id: po!.id, items }, { onSuccess: () => setReceiveQtys({}) })
  }

  const canReceive = po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{po.purchaseNumber}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={po.status} />
            <span className="text-xs text-muted-foreground">{format(new Date(po.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Grand Total</p>
          <p className="font-semibold">৳{(po.grandTotal / 100).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Subtotal / Tax / Discount</p>
          <p className="text-xs">৳{(po.subtotal / 100).toLocaleString()} / ৳{(po.tax / 100).toLocaleString()} / ৳{(po.discount / 100).toLocaleString()}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead className="text-right">Ordered</TableHead>
            <TableHead className="text-right">Received</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            {canReceive && <TableHead className="text-right">Receive Qty</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(po.items ?? []).map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">{item.variantId.slice(0, 12)}…</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className={`text-right ${item.receivedQuantity >= item.quantity ? 'text-green-600' : 'text-amber-600'}`}>
                {item.receivedQuantity}
              </TableCell>
              <TableCell className="text-right">৳{(item.unitCost / 100).toLocaleString()}</TableCell>
              {canReceive && (
                <TableCell className="text-right">
                  <input
                    type="number"
                    min={0}
                    max={item.quantity - item.receivedQuantity}
                    value={receiveQtys[item.id] ?? ""}
                    onChange={(e) => setReceiveQtys(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-16 rounded border px-2 py-1 text-sm text-right"
                    placeholder="0"
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2 pt-1">
        {po.status === 'DRAFT' && (
          <Button size="sm" onClick={() => approve(po.id)} disabled={approving} className="gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {approving ? "Approving…" : "Approve"}
          </Button>
        )}
        {canReceive && (
          <Button size="sm" onClick={handleReceive} disabled={receiving} className="gap-1.5">
            <PackageCheck className="w-4 h-4" />
            {receiving ? "Receiving…" : "Receive Goods"}
          </Button>
        )}
        {po.status !== 'RECEIVED' && po.status !== 'COMPLETED' && po.status !== 'CANCELLED' && (
          <Button size="sm" variant="destructive" onClick={() => cancel(po.id)} disabled={cancelling} className="gap-1.5">
            <XCircle className="w-4 h-4" />
            {cancelling ? "Cancelling…" : "Cancel"}
          </Button>
        )}
      </div>
    </div>
  )
}

const STATUS_TABS: Array<{ value: string; label: string; status?: POStatus }> = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft", status: "DRAFT" },
  { value: "APPROVED", label: "Approved", status: "APPROVED" },
  { value: "PARTIALLY_RECEIVED", label: "Partial", status: "PARTIALLY_RECEIVED" },
  { value: "RECEIVED", label: "Received", status: "RECEIVED" },
]

function POList({ status, onSelect, selectedId, supplierMap }: {
  status?: POStatus
  onSelect: (id: string) => void
  selectedId: string | null
  supplierMap: Record<string, string>
}) {
  const { data: orders = [], isLoading } = useListPurchaseOrders(status)

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
  if (!orders.length) return <p className="text-center text-sm text-muted-foreground py-10">No orders.</p>

  return (
    <div className="space-y-2">
      {orders.map((po: PurchaseOrder) => (
        <button
          key={po.id}
          onClick={() => onSelect(po.id)}
          className={`w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors ${selectedId === po.id ? "border-primary bg-accent" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{po.purchaseNumber}</p>
              <p className="text-xs text-muted-foreground">{supplierMap[po.supplierId] ?? po.supplierId.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={po.status} />
              <p className="text-xs text-muted-foreground mt-0.5">৳{(po.grandTotal / 100).toLocaleString()}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default function PurchaseOrdersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: suppliers = [] } = useListSuppliers()
  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))

  return (
    <PageShell>
      <PageHeader title="Purchase Orders" description="Manage procurement. Approve then receive to update inventory.">
        <Link href="/dashboard/purchases/create-purchase"><Button className="gap-1.5">New Purchase Order</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 flex-wrap">
                  {STATUS_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                  ))}
                </TabsList>
                {STATUS_TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value}>
                    <POList status={t.status} onSelect={setSelectedId} selectedId={selectedId} supplierMap={supplierMap} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedId ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Eye className="w-4 h-4" />Order Detail</CardTitle></CardHeader>
              <CardContent>
                <PODetail id={selectedId} onClose={() => setSelectedId(null)} />
              </CardContent>
            </Card>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
              <p className="text-sm text-muted-foreground">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
