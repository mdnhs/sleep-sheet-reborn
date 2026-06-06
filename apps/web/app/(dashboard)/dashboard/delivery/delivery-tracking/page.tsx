"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useShipments, type ShipmentStatus } from "@/features/(erp-core)/delivery/api/v1-delivery"
import { ShipmentDetailSheet } from "@/features/(erp-core)/delivery/components/shipment-detail-sheet"
import { Search, MapPin } from "lucide-react"

const STATUS_VARIANT: Record<ShipmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "secondary", ASSIGNED: "secondary", PICKED_UP: "outline", IN_TRANSIT: "outline",
  DELIVERED: "default", FAILED: "destructive", RETURNED: "destructive", CANCELLED: "outline",
}

export default function DeliveryTrackingPage() {
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const { data: shipments = [], isLoading } = useShipments()
  const filtered = q ? shipments.filter(s => s.trackingNumber.toLowerCase().includes(q.toLowerCase())) : shipments

  return (
    <PageShell>
      <PageHeader title="Delivery Tracking" description="Track shipment movement and status history." />
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search tracking number…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !filtered.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><MapPin className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No shipments found.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Tracking</TableHead><TableHead>Status</TableHead><TableHead>Courier status</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s.id)}>
                  <TableCell className="font-medium">{s.trackingNumber}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[s.status]}>{s.status.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.courierStatus ?? "—"}</TableCell>
                  <TableCell className="text-sm">{new Date(s.updatedAt).toLocaleString()}</TableCell>
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
