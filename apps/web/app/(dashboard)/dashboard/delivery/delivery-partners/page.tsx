"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useDeliveryPartners, useCreatePartner, useUpdatePartner } from "@/features/(erp-core)/delivery/api/v1-delivery"
import { Plus, Truck } from "lucide-react"

function CreatePartnerDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [phone, setPhone] = useState("")
  const { mutate: create, isPending } = useCreatePartner()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Partner</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Delivery Partner</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Name</Label><Input placeholder="Pathao, RedX, SteadFast…" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Code (optional)</Label><Input value={code} onChange={e => setCode(e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone (optional)</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <Button className="w-full" disabled={isPending || !name}
            onClick={() => create({ name, code: code || undefined, phone: phone || undefined }, { onSuccess: () => { setOpen(false); setName(""); setCode(""); setPhone("") } })}>
            {isPending ? "Creating…" : "Create Partner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DeliveryPartnersPage() {
  const { data: partners = [], isLoading } = useDeliveryPartners()
  const { mutate: update } = useUpdatePartner()
  return (
    <PageShell>
      <PageHeader title="Delivery Partners" description="Courier companies used to fulfill shipments.">
        <CreatePartnerDialog />
      </PageHeader>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !partners.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Truck className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No partners yet.</p></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map(p => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {p.code && <p>Code: {p.code}</p>}
                {p.phone && <p>{p.phone}</p>}
                <Button size="sm" variant="outline" className="w-full"
                  onClick={() => update({ id: p.id, status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>
                  {p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
