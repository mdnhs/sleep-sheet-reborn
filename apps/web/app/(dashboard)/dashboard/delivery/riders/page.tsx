"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRiders, useCreateRider, useUpdateRider, type RiderStatus } from "@/features/(erp-core)/delivery/api/v1-delivery"
import { Plus, Bike } from "lucide-react"

const STATUS_VARIANT: Record<RiderStatus, "default" | "secondary" | "outline"> = { AVAILABLE: "default", BUSY: "secondary", INACTIVE: "outline" }

function CreateRiderDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const { mutate: create, isPending } = useCreateRider()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Rider</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Rider</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <Button className="w-full" disabled={isPending || !name || !phone}
            onClick={() => create({ name, phone }, { onSuccess: () => { setOpen(false); setName(""); setPhone("") } })}>
            {isPending ? "Creating…" : "Create Rider"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function RidersPage() {
  const { data: riders = [], isLoading } = useRiders()
  const { mutate: update } = useUpdateRider()
  return (
    <PageShell>
      <PageHeader title="Riders" description="Delivery personnel and their availability.">
        <CreateRiderDialog />
      </PageHeader>
      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : !riders.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Bike className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No riders yet.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {riders.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Select value={r.status} onValueChange={(v) => { if (v) update({ id: r.id, status: v as RiderStatus }) }}>
                      <SelectTrigger className="w-[140px] ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="BUSY">Busy</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  )
}
