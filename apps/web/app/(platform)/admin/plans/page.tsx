"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminPlans, useCreatePlan, useUpdatePlan } from "@/features/(saas)/billing/api/admin-billing"

function fmt(n: number) { return n === 0 ? "Free/Custom" : `৳${(n / 100).toLocaleString()}` }
function lim(n: number) { return n >= 1e9 ? "∞" : n.toLocaleString() }

function CreatePlanDialog() {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({
    name: "", billingCycle: "MONTHLY", price: "0",
    limitUsers: "5", limitOutlets: "1", limitWarehouses: "1",
    limitProducts: "100", limitOrdersPerMonth: "500", limitThemes: "1", limitFunnels: "3",
    featureFlags: "{}",
  })
  const { mutate: create, isPending } = useCreatePlan()
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button>New Plan</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Plan</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1 col-span-2"><Label>Name</Label><Input value={f.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Cycle</Label>
            <Select value={f.billingCycle} onValueChange={(v) => set("billingCycle", v ?? "MONTHLY")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="MONTHLY">Monthly</SelectItem><SelectItem value="YEARLY">Yearly</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Price (৳)</Label><Input type="number" value={f.price} onChange={e => set("price", e.target.value)} /></div>
          <div className="space-y-1"><Label>Users</Label><Input type="number" value={f.limitUsers} onChange={e => set("limitUsers", e.target.value)} /></div>
          <div className="space-y-1"><Label>Outlets</Label><Input type="number" value={f.limitOutlets} onChange={e => set("limitOutlets", e.target.value)} /></div>
          <div className="space-y-1"><Label>Warehouses</Label><Input type="number" value={f.limitWarehouses} onChange={e => set("limitWarehouses", e.target.value)} /></div>
          <div className="space-y-1"><Label>Products</Label><Input type="number" value={f.limitProducts} onChange={e => set("limitProducts", e.target.value)} /></div>
          <div className="space-y-1"><Label>Orders/mo</Label><Input type="number" value={f.limitOrdersPerMonth} onChange={e => set("limitOrdersPerMonth", e.target.value)} /></div>
          <div className="space-y-1"><Label>Themes</Label><Input type="number" value={f.limitThemes} onChange={e => set("limitThemes", e.target.value)} /></div>
          <div className="space-y-1"><Label>Funnels</Label><Input type="number" value={f.limitFunnels} onChange={e => set("limitFunnels", e.target.value)} /></div>
          <div className="space-y-1 col-span-2"><Label>Feature Flags (JSON)</Label><Input value={f.featureFlags} onChange={e => set("featureFlags", e.target.value)} /></div>
        </div>
        <Button
          className="w-full mt-3"
          disabled={isPending || !f.name}
          onClick={() => create({
            name: f.name, billingCycle: f.billingCycle,
            price: Math.round(Number(f.price) * 100),
            limitUsers: Number(f.limitUsers), limitOutlets: Number(f.limitOutlets), limitWarehouses: Number(f.limitWarehouses),
            limitProducts: Number(f.limitProducts), limitOrdersPerMonth: Number(f.limitOrdersPerMonth),
            limitThemes: Number(f.limitThemes), limitFunnels: Number(f.limitFunnels),
            featureFlags: f.featureFlags || "{}",
          }, { onSuccess: () => setOpen(false) })}
        >
          {isPending ? "Creating…" : "Create Plan"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default function PlansPage() {
  const { data: plans = [], isLoading } = useAdminPlans()
  const { mutate: update } = useUpdatePlan()

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground">Global plan catalog and limits.</p>
        </div>
        <CreatePlanDialog />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Outlets</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Orders/mo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{fmt(p.price)}</TableCell>
                  <TableCell className="text-right">{lim(p.limitProducts)}</TableCell>
                  <TableCell className="text-right">{lim(p.limitOutlets)}</TableCell>
                  <TableCell className="text-right">{lim(p.limitUsers)}</TableCell>
                  <TableCell className="text-right">{lim(p.limitOrdersPerMonth)}</TableCell>
                  <TableCell><Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => update({ id: p.id, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                      {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
