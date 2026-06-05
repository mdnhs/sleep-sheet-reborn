"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useShipments, useCreateShipment, useDeliveryPartners, type ShipmentStatus } from "@/features/(erp-core)/delivery/api/v1-delivery"
import { ShipmentDetailSheet } from "@/features/(erp-core)/delivery/components/shipment-detail-sheet"
import { useListOrders } from "@/features/(erp-core)/orders/api/v1-orders"
import { Plus, PackageCheck } from "lucide-react"

const STATUS_VARIANT: Record<ShipmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "secondary", ASSIGNED: "secondary", PICKED_UP: "outline", IN_TRANSIT: "outline",
  DELIVERED: "default", FAILED: "destructive", RETURNED: "destructive", CANCELLED: "outline",
}

function CreateShipmentDialog() {
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [partnerId, setPartnerId] = useState("")
  // Orders confirmed onward are eligible for shipment
  const { data: orders = [] } = useListOrders("CONFIRMED")
  const { data: partners = [] } = useDeliveryPartners()
  const { mutate: create, isPending } = useCreateShipment()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Shipment</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Shipment</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Order</Label>
            <Select value={orderId} onValueChange={(v) => setOrderId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select confirmed order" /></SelectTrigger>
              <SelectContent>{orders.map(o => <SelectItem key={o.id} value={o.id}>{o.orderNumber}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Courier (optional)</Label>
            <Select value={partnerId} onValueChange={(v) => setPartnerId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select courier" /></SelectTrigger>
              <SelectContent>{partners.filter(p => p.status === "ACTIVE").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={isPending || !orderId}
            onClick={() => create({ orderId, deliveryPartnerId: partnerId || undefined }, { onSuccess: () => { setOpen(false); setOrderId(""); setPartnerId("") } })}>
            {isPending ? "Creating…" : "Create Shipment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AssignDeliveriesPage() {
  const [status, setStatus] = useState<string>("all")
  const [selected, setSelected] = useState<string | null>(null)
  const { data: shipments = [], isLoading } = useShipments(status === "all" ? undefined : (status as ShipmentStatus))

  return (
    <PageShell>
      <PageHeader title="Assign Deliveries" description="Create shipments and assign riders or couriers.">
        <CreateShipmentDialog />
      </PageHeader>

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="PICKED_UP">Picked up</SelectItem>
            <SelectItem value="IN_TRANSIT">In transit</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !shipments.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><PackageCheck className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No shipments.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Tracking</TableHead><TableHead>Status</TableHead><TableHead>Courier status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
            <TableBody>
              {shipments.map(s => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s.id)}>
                  <TableCell className="font-medium">{s.trackingNumber}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[s.status]}>{s.status.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.courierStatus ?? "—"}</TableCell>
                  <TableCell className="text-sm">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ShipmentDetailSheet shipmentId={selected} onClose={() => setSelected(null)} />
    </PageShell>
  )
}
