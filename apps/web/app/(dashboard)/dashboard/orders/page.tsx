"use client"
import { useState } from "react"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useListOrders,
  useGetOrder,
  useConfirmOrder,
  useProcessOrder,
  usePackOrder,
  useShipOrder,
  useDeliverOrder,
  useCancelOrder,
  type Order,
  type OrderStatus,
} from "@/features/(erp-core)/orders/api/v1-orders"
import { format } from "date-fns"
import { CheckCircle, Package, Truck, XCircle, Eye, Plus } from "lucide-react"

const STATUS_TABS: Array<{ value: string; label: string; status?: OrderStatus }> = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending", status: "PENDING" },
  { value: "CONFIRMED", label: "Confirmed", status: "CONFIRMED" },
  { value: "PROCESSING", label: "Processing", status: "PROCESSING" },
  { value: "PACKED", label: "Packed", status: "PACKED" },
  { value: "SHIPPED", label: "Shipped", status: "SHIPPED" },
  { value: "DELIVERED", label: "Delivered", status: "DELIVERED" },
  { value: "CANCELLED", label: "Cancelled", status: "CANCELLED" },
]

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "default",
  PACKED: "default",
  SHIPPED: "default",
  DELIVERED: "outline",
  CANCELLED: "destructive",
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
}

function OrderDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: order, isLoading } = useGetOrder(id)
  const { mutate: confirm, isPending: confirming } = useConfirmOrder()
  const { mutate: process, isPending: processing } = useProcessOrder()
  const { mutate: pack, isPending: packing } = usePackOrder()
  const { mutate: ship, isPending: shipping } = useShipOrder()
  const { mutate: deliver, isPending: delivering } = useDeliverOrder()
  const { mutate: cancel, isPending: cancelling } = useCancelOrder()

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
  if (!order) return <p className="text-sm text-muted-foreground">Order not found.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold font-mono">{order.orderNumber}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      {order.address && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-0.5">
          <p className="font-medium">{order.address.name} — {order.address.phone}</p>
          <p className="text-muted-foreground">
            {order.address.address}
            {order.address.area ? `, ${order.address.area}` : ""},&nbsp;{order.address.city}
          </p>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">{item.variantId.slice(0, 12)}…</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">৳{(item.unitPrice / 100).toLocaleString()}</TableCell>
              <TableCell className="text-right">৳{(item.lineTotal / 100).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-sm space-y-1 border-t pt-2">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{(order.subtotal / 100).toLocaleString()}</span></div>
        {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-৳{(order.discount / 100).toLocaleString()}</span></div>}
        {order.shippingCost > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>৳{(order.shippingCost / 100).toLocaleString()}</span></div>}
        <div className="flex justify-between font-semibold"><span>Grand Total</span><span>৳{(order.grandTotal / 100).toLocaleString()}</span></div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {order.status === 'PENDING' && (
          <Button size="sm" onClick={() => confirm(order.id)} disabled={confirming} className="gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {confirming ? "Confirming…" : "Confirm"}
          </Button>
        )}
        {order.status === 'CONFIRMED' && (
          <Button size="sm" onClick={() => process(order.id)} disabled={processing} className="gap-1.5">
            <Package className="w-4 h-4" />
            {processing ? "Processing…" : "Process"}
          </Button>
        )}
        {order.status === 'PROCESSING' && (
          <Button size="sm" onClick={() => pack(order.id)} disabled={packing} className="gap-1.5">
            <Package className="w-4 h-4" />
            {packing ? "Packing…" : "Pack"}
          </Button>
        )}
        {order.status === 'PACKED' && (
          <Button size="sm" onClick={() => ship(order.id)} disabled={shipping} className="gap-1.5">
            <Truck className="w-4 h-4" />
            {shipping ? "Shipping…" : "Ship"}
          </Button>
        )}
        {order.status === 'SHIPPED' && (
          <Button size="sm" onClick={() => deliver(order.id)} disabled={delivering} className="gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {delivering ? "Delivering…" : "Mark Delivered"}
          </Button>
        )}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <Button size="sm" variant="destructive" onClick={() => cancel(order.id)} disabled={cancelling} className="gap-1.5">
            <XCircle className="w-4 h-4" />
            {cancelling ? "Cancelling…" : "Cancel"}
          </Button>
        )}
      </div>

      {order.timeline.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timeline</p>
          {order.timeline.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground whitespace-nowrap">{format(new Date(entry.createdAt), "MMM d HH:mm")}</span>
              <span className="font-medium">{entry.event}</span>
              {entry.note && <span className="text-muted-foreground">— {entry.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderList({ status, onSelect, selectedId }: {
  status?: OrderStatus
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  const { data: orders = [], isLoading } = useListOrders(status)

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
  if (!orders.length) return <p className="text-center text-sm text-muted-foreground py-10">No orders.</p>

  return (
    <div className="space-y-2">
      {orders.map((o: Order) => (
        <button
          key={o.id}
          onClick={() => onSelect(o.id)}
          className={`w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors ${selectedId === o.id ? "border-primary bg-accent" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm font-mono">{o.orderNumber}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(o.createdAt), "MMM d, yyyy")}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={o.status} />
              <p className="text-xs text-muted-foreground mt-0.5">৳{(o.grandTotal / 100).toLocaleString()}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default function OrdersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <PageShell>
      <PageHeader title="Orders" description="Manage customer orders. Track from creation to delivery.">
        <Link href="/dashboard/orders/create">
          <Button className="gap-1.5"><Plus className="w-4 h-4" />New Order</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  {STATUS_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                  ))}
                </TabsList>
                {STATUS_TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value}>
                    <OrderList status={t.status} onSelect={setSelectedId} selectedId={selectedId} />
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
                  <Eye className="w-4 h-4" />Order Detail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderDetail id={selectedId} onClose={() => setSelectedId(null)} />
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
