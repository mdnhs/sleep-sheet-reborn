"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useListSuppliers, useGetSupplierPayments, useAddSupplierPayment } from "@/features/(erp-core)/suppliers/api/suppliers"
import { useGetSupplierDue } from "@/features/(erp-core)/purchases/api/purchases"
import { Wallet } from "lucide-react"
import { format } from "date-fns"

function DueSummary({ supplierId }: { supplierId: string }) {
  const { data: due } = useGetSupplierDue(supplierId)
  if (!due) return null
  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="rounded-lg bg-muted/50 p-3 text-center">
        <p className="text-xs text-muted-foreground">Total Purchased</p>
        <p className="font-semibold text-sm">৳{(due.totalPurchased / 100).toLocaleString()}</p>
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-center">
        <p className="text-xs text-muted-foreground">Total Paid</p>
        <p className="font-semibold text-sm text-green-600">৳{(due.totalPaid / 100).toLocaleString()}</p>
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-center">
        <p className="text-xs text-muted-foreground">Outstanding Due</p>
        <p className={`font-semibold text-sm ${due.due > 0 ? 'text-red-600' : ''}`}>৳{(due.due / 100).toLocaleString()}</p>
      </div>
    </div>
  )
}

function PaymentForm({ supplierId }: { supplierId: string }) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<"CASH" | "BANK" | "BKASH" | "NAGAD" | "CHEQUE">("CASH")
  const [ref, setRef] = useState("")
  const [notes, setNotes] = useState("")
  const { mutate: addPayment, isPending } = useAddSupplierPayment()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount) return
    addPayment(
      { supplierId, amount: parseInt(amount), paymentMethod: method, referenceNo: ref || undefined, notes: notes || undefined },
      { onSuccess: () => { setAmount(""); setRef(""); setNotes("") } },
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Amount (paisa) *</label>
        <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="Amount in paisa" />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Method</label>
        <Select value={method} onValueChange={(v) => setMethod(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["CASH", "BANK", "BKASH", "NAGAD", "CHEQUE"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Reference No</label>
        <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="TXN/Cheque no." />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Notes</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </div>
      <Button type="submit" className="w-full gap-1.5" disabled={isPending}>
        <Wallet className="w-4 h-4" />{isPending ? "Recording…" : "Record Payment"}
      </Button>
    </form>
  )
}

function PaymentHistory({ supplierId }: { supplierId: string }) {
  const { data: payments = [], isLoading } = useGetSupplierPayments(supplierId)

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
  if (!payments.length) return <p className="text-center text-sm text-muted-foreground py-8">No payments yet.</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Ref</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(p => (
          <TableRow key={p.id}>
            <TableCell className="font-semibold text-green-600">৳{(p.amount / 100).toLocaleString()}</TableCell>
            <TableCell><span className="text-xs bg-muted px-2 py-0.5 rounded">{p.paymentMethod}</span></TableCell>
            <TableCell className="text-xs text-muted-foreground">{p.referenceNo ?? "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "MMM d, HH:mm")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function SupplierPaymentsPage() {
  const { data: suppliers = [], isLoading } = useListSuppliers('ACTIVE')
  const [selectedId, setSelectedId] = useState("")

  return (
    <PageShell>
      <PageHeader title="Supplier Payments" description="Record payments and track outstanding dues." />

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Select Supplier</label>
          {isLoading ? (
            <Skeleton className="h-10 w-full max-w-sm rounded" />
          ) : (
            <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
              <SelectTrigger className="max-w-sm"><SelectValue placeholder="Choose supplier…" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.phone}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">New Payment</CardTitle></CardHeader>
              <CardContent>
                <DueSummary supplierId={selectedId} />
                <PaymentForm supplierId={selectedId} />
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
                <CardContent><PaymentHistory supplierId={selectedId} /></CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
