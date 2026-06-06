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
import { Plus, Tags } from "lucide-react"
import { useCustomerGroups, useCreateGroup, useUpdateGroup } from "@/features/(erp-core)/customers/api/v1-customers"

function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [discount, setDiscount] = useState("0")
  const { mutate: create, isPending } = useCreateGroup()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Group</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Customer Group</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Name</Label><Input placeholder="Regular, Silver, Gold, VIP…" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Default Discount %</Label><Input type="number" min={0} max={100} value={discount} onChange={e => setDiscount(e.target.value)} /></div>
          <Button className="w-full" disabled={isPending || !name}
            onClick={() => create({ name, discountPercent: Number(discount) || 0 }, { onSuccess: () => { setOpen(false); setName(""); setDiscount("0") } })}>
            {isPending ? "Creating…" : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CustomerGroupsPage() {
  const { data: groups = [], isLoading } = useCustomerGroups()
  const { mutate: update } = useUpdateGroup()
  return (
    <PageShell>
      <PageHeader title="Customer Groups" description="Segment customers for discounts, loyalty rules and marketing.">
        <CreateGroupDialog />
      </PageHeader>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !groups.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Tags className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No groups yet.</p></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <Card key={g.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <Badge variant={g.status === "ACTIVE" ? "default" : "secondary"}>{g.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Discount: {g.discountPercent}%</p>
                <Button size="sm" variant="outline" className="w-full"
                  onClick={() => update({ id: g.id, status: g.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>
                  {g.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
