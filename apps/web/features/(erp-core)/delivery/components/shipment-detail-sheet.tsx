"use client"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useShipment, useShipmentAction, useRiders, useDeliveryPartners, type ShipmentStatus,
} from "@/features/(erp-core)/delivery/api/v1-delivery"

const STATUS_VARIANT: Record<ShipmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "secondary", ASSIGNED: "secondary", PICKED_UP: "outline", IN_TRANSIT: "outline",
  DELIVERED: "default", FAILED: "destructive", RETURNED: "destructive", CANCELLED: "outline",
}

export function ShipmentDetailSheet({ shipmentId, onClose }: { shipmentId: string | null; onClose: () => void }) {
  const { data: shipment, isLoading } = useShipment(shipmentId)
  const { data: riders = [] } = useRiders()
  const { data: partners = [] } = useDeliveryPartners()
  const assignRider = useShipmentAction("assign-rider")
  const assignPartner = useShipmentAction("assign-partner")
  const pickup = useShipmentAction("pickup")
  const transit = useShipmentAction("transit")
  const deliver = useShipmentAction("deliver")
  const failAction = useShipmentAction("fail")
  const rto = useShipmentAction("return")
  const cancel = useShipmentAction("cancel")
  const courier = useShipmentAction("courier-status")

  const [failReason, setFailReason] = useState("")
  const [courierStatus, setCourierStatus] = useState("")

  const id = shipment?.id ?? ""
  const st = shipment?.status
  const terminal = st === "DELIVERED" || st === "RETURNED" || st === "CANCELLED"

  return (
    <Sheet open={!!shipmentId} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        {isLoading || !shipment ? (
          <div className="p-4"><Skeleton className="h-64 rounded-lg" /></div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>{shipment.trackingNumber}</SheetTitle>
                <Badge variant={STATUS_VARIANT[shipment.status]}>{shipment.status.replace(/_/g, " ")}</Badge>
              </div>
              {shipment.courierStatus && <p className="text-xs text-muted-foreground">Courier: {shipment.courierStatus}</p>}
            </SheetHeader>

            <div className="px-4 pb-6 space-y-4">
              {/* Actions */}
              <div className="space-y-2">
                {st === "CREATED" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Assign rider</Label>
                      <Select onValueChange={(v) => { if (v) assignRider.mutate({ id, body: { riderId: String(v) } }) }}>
                        <SelectTrigger><SelectValue placeholder="Select rider" /></SelectTrigger>
                        <SelectContent>{riders.filter(r => r.status !== "INACTIVE").map(r => <SelectItem key={r.id} value={r.id}>{r.name} · {r.status}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Courier</Label>
                      <Select onValueChange={(v) => { if (v) assignPartner.mutate({ id, body: { deliveryPartnerId: String(v) } }) }}>
                        <SelectTrigger><SelectValue placeholder="Select courier" /></SelectTrigger>
                        <SelectContent>{partners.filter(p => p.status === "ACTIVE").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  {st === "ASSIGNED" && <Button size="sm" onClick={() => pickup.mutate({ id })}>Pick up</Button>}
                  {st === "PICKED_UP" && <Button size="sm" onClick={() => transit.mutate({ id })}>In transit</Button>}
                  {(st === "PICKED_UP" || st === "IN_TRANSIT") && <Button size="sm" onClick={() => deliver.mutate({ id })}>Deliver</Button>}
                  {st === "FAILED" && <Button size="sm" onClick={() => rto.mutate({ id })}>Return to origin</Button>}
                  {(st === "CREATED" || st === "ASSIGNED") && <Button size="sm" variant="outline" onClick={() => cancel.mutate({ id })}>Cancel</Button>}
                </div>

                {(st === "PICKED_UP" || st === "IN_TRANSIT") && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1"><Label className="text-xs">Fail reason</Label><Input value={failReason} onChange={e => setFailReason(e.target.value)} placeholder="Customer unavailable…" /></div>
                    <Button size="sm" variant="destructive" disabled={!failReason} onClick={() => failAction.mutate({ id, body: { reason: failReason } }, )}>Fail</Button>
                  </div>
                )}

                {!terminal && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1"><Label className="text-xs">Courier status sync</Label><Input value={courierStatus} onChange={e => setCourierStatus(e.target.value)} placeholder="e.g. picked_up" /></div>
                    <Button size="sm" variant="outline" disabled={!courierStatus} onClick={() => { courier.mutate({ id, body: { courierStatus } }); setCourierStatus("") }}>Sync</Button>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium mb-2">Tracking history</h4>
                <div className="space-y-2">
                  {shipment.events.map(ev => (
                    <div key={ev.id} className="flex gap-3 text-sm border-l-2 pl-3 py-0.5">
                      <div>
                        <p className="font-medium">{ev.status.replace(/_/g, " ")}</p>
                        {ev.note && <p className="text-xs text-muted-foreground">{ev.note}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
