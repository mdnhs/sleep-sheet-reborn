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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter, Trash2 } from "lucide-react"
import {
  useFunnels, useFunnel, useFunnelTemplates, useCreateFunnel, useUpdateFunnel, useAddStep, useDeleteStep,
  type CampaignStatus, type StepType,
} from "@/features/(growth)/growth/api/v1-growth"

const STATUS_VARIANT: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary", ACTIVE: "default", PAUSED: "outline", ENDED: "destructive",
}
const STEP_TYPES: StepType[] = ["LANDING", "UPSELL", "DOWNSELL", "CHECKOUT", "THANKYOU"]
const taka = (n: number) => `৳${n.toLocaleString()}`

function CreateFunnelDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [templateId, setTemplateId] = useState("")
  const { data: templates = [] } = useFunnelTemplates()
  const { mutate: create, isPending } = useCreateFunnel()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Funnel</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Funnel</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="COD Express Funnel" /></div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Pick a template" /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.type})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={isPending || !name} onClick={() => create({ name, templateId: templateId || undefined }, { onSuccess: () => { setOpen(false); setName(""); setTemplateId("") } })}>
            {isPending ? "Creating…" : "Create Funnel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FunnelSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: f, isLoading } = useFunnel(id)
  const update = useUpdateFunnel()
  const addStep = useAddStep()
  const delStep = useDeleteStep(id ?? "")
  const [stepType, setStepType] = useState<StepType>("LANDING")
  return (
    <Sheet open={!!id} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {isLoading || !f ? <div className="p-4"><Skeleton className="h-64 rounded-lg" /></div> : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>{f.name}</SheetTitle>
                <Badge variant={STATUS_VARIANT[f.status]}>{f.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">/{f.slug} · {f.type}</p>
            </SheetHeader>
            <div className="px-4 pb-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 pt-4">
                <Stat label="Visitors" value={String(f.stats.visitors)} />
                <Stat label="Orders" value={String(f.stats.orders)} />
                <Stat label="Revenue" value={taka(f.stats.revenue)} />
              </div>

              <div className="flex gap-2">
                {f.status !== "ENDED" && <Button size="sm" variant="outline" className="flex-1" onClick={() => update.mutate({ id: f.id, status: f.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}>{f.status === "ACTIVE" ? "Pause" : "Activate"}</Button>}
                {f.status !== "ENDED" && <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: f.id, status: "ENDED" })}>End</Button>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={stepType} onValueChange={(v) => setStepType((v ?? "LANDING") as StepType)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{STEP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => addStep.mutate({ funnelId: f.id, type: stepType })}>Add Step</Button>
                </div>
                {!f.steps.length ? <p className="text-sm text-muted-foreground py-3 text-center">No steps yet.</p> : f.steps.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span><span className="text-muted-foreground mr-2">{i + 1}.</span>{s.type}</span>
                    <Button size="icon" variant="ghost" onClick={() => delStep.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-2 text-center"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-semibold truncate">{value}</p></div>
}

export default function FunnelsPage() {
  const { data: funnels = [], isLoading } = useFunnels()
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <PageShell>
      <PageHeader title="Funnels" description="Conversion funnels: single / bundle / COD / lead, with upsell & downsell steps.">
        <CreateFunnelDialog />
      </PageHeader>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !funnels.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Filter className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No funnels yet.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {funnels.map(f => (
                <TableRow key={f.id} className="cursor-pointer" onClick={() => setSelected(f.id)}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{f.type}</span></TableCell>
                  <TableCell className="text-muted-foreground">/{f.slug}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[f.status]}>{f.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <FunnelSheet id={selected} onClose={() => setSelected(null)} />
    </PageShell>
  )
}
