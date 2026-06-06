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
import { Plus, Users } from "lucide-react"
import {
  useCustomers, useCreateCustomer, useCustomerGroups, type CustomerStatus, type CustomerType,
} from "@/features/(erp-core)/customers/api/v1-customers"
import { CustomerDetailSheet } from "./customer-detail-sheet"

const STATUS_VARIANT: Record<CustomerStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default", INACTIVE: "secondary", BLOCKED: "destructive", ARCHIVED: "outline",
}
const taka = (n: number) => `৳${n.toLocaleString()}`

function CreateCustomerDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [type, setType] = useState<CustomerType>("REGISTERED")
  const [groupId, setGroupId] = useState<string>("")
  const { data: groups = [] } = useCustomerGroups()
  const { mutate: create, isPending } = useCreateCustomer()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button className="gap-1.5"><Plus className="w-4 h-4" />New Customer</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Customer</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email (optional)</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CustomerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["GUEST", "REGISTERED", "WHOLESALE", "CORPORATE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Group (optional)</Label>
              <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" disabled={isPending || !name || !phone}
            onClick={() => create(
              { name, phone, email: email || undefined, type, groupId: groupId || undefined },
              { onSuccess: () => { setOpen(false); setName(""); setPhone(""); setEmail(""); setGroupId("") } },
            )}>
            {isPending ? "Creating…" : "Create Customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CustomerListView({ title, description }: { title: string; description: string }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("")
  const [selected, setSelected] = useState<string | null>(null)
  const { data: customers = [], isLoading } = useCustomers({ search: search || undefined, status: status || undefined })

  return (
    <PageShell>
      <PageHeader title={title} description={description}>
        <CreateCustomerDialog />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search name, phone, email…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={status || "ALL"} onValueChange={(v) => setStatus(v && v !== "ALL" ? v : "")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["ALL", "ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !customers.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Users className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No customers found.</p></div>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Wallet</TableHead><TableHead className="text-right">Points</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map(c => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{c.type}</span></TableCell>
                  <TableCell className="text-right">{taka(c.walletBalance)}</TableCell>
                  <TableCell className="text-right">{c.loyaltyPoints}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CustomerDetailSheet customerId={selected} onClose={() => setSelected(null)} />
    </PageShell>
  )
}
