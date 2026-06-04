"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useListSuppliers, useCreateSupplier, useArchiveSupplier, type Supplier } from "@/features/(erp-core)/suppliers/api/suppliers"
import { Plus, Archive, Phone, Mail } from "lucide-react"

function CreateSupplierDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const { mutate: create, isPending } = useCreateSupplier()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create(
      { name, phone, email: email || undefined, address: address || undefined, notes: notes || undefined },
      {
        onSuccess: () => {
          onOpenChange(false)
          setName(""); setPhone(""); setEmail(""); setAddress(""); setNotes("")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Supplier name" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Phone *</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+880..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="supplier@example.com" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Address</label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Full address" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating…" : "Create Supplier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SupplierRow({ supplier }: { supplier: Supplier }) {
  const { mutate: archive, isPending } = useArchiveSupplier()

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-sm">{supplier.name}</p>
        {supplier.address && <p className="text-xs text-muted-foreground">{supplier.address}</p>}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-sm">
          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          {supplier.phone}
        </div>
        {supplier.email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="w-3 h-3" />{supplier.email}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={supplier.status === 'ACTIVE' ? 'default' : supplier.status === 'INACTIVE' ? 'secondary' : 'destructive'}>
          {supplier.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {supplier.status !== 'ARCHIVED' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => archive(supplier.id)}
            disabled={isPending}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function AllSuppliersPage() {
  const { data: suppliers = [], isLoading } = useListSuppliers()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <PageShell>
      <PageHeader title="Suppliers" description="Manage vendors and track supplier dues.">
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" />New Supplier</Button>
      </PageHeader>
      <CreateSupplierDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Card>
        <CardHeader><CardTitle>All Suppliers ({suppliers.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
          ) : suppliers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No suppliers yet. Add your first supplier.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => <SupplierRow key={s.id} supplier={s} />)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
