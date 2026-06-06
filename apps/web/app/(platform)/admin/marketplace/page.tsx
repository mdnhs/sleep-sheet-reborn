"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useAdminThemes, useAdminFunnelTemplates, useCreateAdminTheme, useSetThemeStatus,
  useCreateAdminTemplate, useSetTemplateStatus,
} from "@/features/(saas)/platform/api/admin-platform"

const taka = (n: number) => (n === 0 ? "Free" : `৳${(n / 100).toLocaleString()}`)

function NewThemeDialog() {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: "", slug: "", type: "FREE", price: "0" })
  const { mutate, isPending } = useCreateAdminTheme()
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button size="sm">New Theme</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Publish Theme</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1 col-span-2"><Label>Name</Label><Input value={f.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="space-y-1"><Label>Slug</Label><Input value={f.slug} onChange={e => set("slug", e.target.value)} /></div>
          <div className="space-y-1"><Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => set("type", v ?? "FREE")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="FREE">Free</SelectItem><SelectItem value="PREMIUM">Premium</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2"><Label>Price (paisa)</Label><Input type="number" value={f.price} onChange={e => set("price", e.target.value)} /></div>
          <Button className="col-span-2" disabled={isPending || !f.name || !f.slug}
            onClick={() => mutate({ name: f.name, slug: f.slug, type: f.type, price: Number(f.price) || 0 }, { onSuccess: () => setOpen(false) })}>Publish</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewTemplateDialog() {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: "", type: "SINGLE", price: "0" })
  const { mutate, isPending } = useCreateAdminTemplate()
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button size="sm">New Template</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Publish Funnel Template</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1 col-span-2"><Label>Name</Label><Input value={f.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="space-y-1"><Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => set("type", v ?? "SINGLE")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["SINGLE", "MULTI", "BUNDLE", "COD", "LEAD", "UPSELL", "DOWNSELL"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Price (paisa)</Label><Input type="number" value={f.price} onChange={e => set("price", e.target.value)} /></div>
          <Button className="col-span-2" disabled={isPending || !f.name}
            onClick={() => mutate({ name: f.name, type: f.type, price: Number(f.price) || 0 }, { onSuccess: () => setOpen(false) })}>Publish</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MarketplacePage() {
  const { data: themes = [], isLoading: lt } = useAdminThemes()
  const { data: templates = [], isLoading: lf } = useAdminFunnelTemplates()
  const themeStatus = useSetThemeStatus()
  const tmplStatus = useSetTemplateStatus()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Marketplace Management</h1>
        <p className="text-sm text-muted-foreground">Curate the global theme and funnel-template catalogs. Publish or deprecate assets.</p>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Themes</h2><NewThemeDialog /></div>
        {lt ? <Skeleton className="h-40 rounded-xl" /> : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {themes.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{taka(t.price)}</TableCell>
                    <TableCell><Badge variant={t.status === "ACTIVE" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => themeStatus.mutate({ id: t.id, status: t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{t.status === "ACTIVE" ? "Deprecate" : "Publish"}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Funnel Templates</h2><NewTemplateDialog /></div>
        {lf ? <Skeleton className="h-40 rounded-xl" /> : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{taka(t.price)}</TableCell>
                    <TableCell><Badge variant={t.status === "ACTIVE" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => tmplStatus.mutate({ id: t.id, status: t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{t.status === "ACTIVE" ? "Deprecate" : "Publish"}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
