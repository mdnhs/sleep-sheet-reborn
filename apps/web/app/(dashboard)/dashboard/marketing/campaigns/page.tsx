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
import { Plus, Megaphone } from "lucide-react"
import { useCampaigns, useCreateCampaign, useUpdateCampaign, type CampaignType, type CampaignStatus } from "@/features/(growth)/growth/api/v1-growth"

const STATUS_VARIANT: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary", ACTIVE: "default", PAUSED: "outline", ENDED: "destructive",
}
const NEXT: Record<CampaignStatus, CampaignStatus> = { DRAFT: "ACTIVE", ACTIVE: "PAUSED", PAUSED: "ACTIVE", ENDED: "ENDED" }

function CreateCampaignDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<CampaignType>("PRODUCT")
  const { mutate: create, isPending } = useCreateCampaign()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Campaign</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Eid Mega Sale" /></div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType((v ?? "PRODUCT") as CampaignType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["PRODUCT", "CATEGORY", "SEASONAL"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={isPending || !name} onClick={() => create({ name, type }, { onSuccess: () => { setOpen(false); setName("") } })}>
            {isPending ? "Creating…" : "Create Campaign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CampaignsPage() {
  const { data: campaigns = [], isLoading } = useCampaigns()
  const { mutate: update } = useUpdateCampaign()
  return (
    <PageShell>
      <PageHeader title="Campaigns" description="Product, category and seasonal marketing campaigns with UTM attribution.">
        <CreateCampaignDialog />
      </PageHeader>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !campaigns.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Megaphone className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No campaigns yet.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {campaigns.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">/{c.slug}</TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{c.type}</span></TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {c.status !== "ENDED" && (
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => update({ id: c.id, status: NEXT[c.status] })}>{c.status === "ACTIVE" ? "Pause" : "Activate"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => update({ id: c.id, status: "ENDED" })}>End</Button>
                      </div>
                    )}
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
