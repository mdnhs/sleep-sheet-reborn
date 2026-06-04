"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  useListExpenses,
  useCreateExpense,
  useApproveExpense,
  useRejectExpense,
  useListAccounts,
  type ExpenseCategory,
  type ExpenseStatus,
  type FinExpense,
} from "@/features/(erp-core)/finance/api/v1-finance"
import { format } from "date-fns"
import { Plus, CheckCircle, XCircle } from "lucide-react"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

const CATEGORIES: ExpenseCategory[] = ['RENT', 'SALARY', 'UTILITY', 'TRANSPORTATION', 'MARKETING', 'MISCELLANEOUS', 'OTHER']
const STATUS_VARIANT: Record<ExpenseStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary", APPROVED: "default", REJECTED: "destructive",
}

function CreateExpenseDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<ExpenseCategory>("MISCELLANEOUS")
  const [amount, setAmount] = useState("")
  const [accountId, setAccountId] = useState("")
  const [notes, setNotes] = useState("")
  const { mutate: create, isPending } = useCreateExpense()
  const { data: accounts = [] } = useListAccounts()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-1.5"><Plus className="w-4 h-4" />New Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Expense</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="e.g. Office Rent - June" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Amount (৳)</Label>
            <Input type="number" min="1" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Debit Account (optional — debited on approval)</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
            >
              <option value="">None</option>
              {accounts.filter(a => a.status === 'ACTIVE').map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input placeholder="…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={isPending || !title || !amount}
            onClick={() => {
              create({
                title,
                category,
                amount: Math.round(Number(amount) * 100),
                accountId: accountId || undefined,
                notes: notes || undefined,
              }, { onSuccess: () => { setOpen(false); setTitle(""); setAmount(""); setNotes("") } })
            }}
          >
            {isPending ? "Creating…" : "Create Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseRow({ expense }: { expense: FinExpense }) {
  const { mutate: approve, isPending: approving } = useApproveExpense()
  const { mutate: reject, isPending: rejecting } = useRejectExpense()

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{expense.title}</p>
          <Badge variant="outline" className="text-xs">{expense.category}</Badge>
          <Badge variant={STATUS_VARIANT[expense.status]} className="text-xs">{expense.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(expense.createdAt), "MMM d, yyyy")}{expense.notes ? ` — ${expense.notes}` : ''}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className="font-semibold text-red-500">{fmt(expense.amount)}</p>
        {expense.status === 'PENDING' && (
          <>
            <Button size="sm" className="gap-1" onClick={() => approve(expense.id)} disabled={approving}>
              <CheckCircle className="w-3.5 h-3.5" />{approving ? "…" : "Approve"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => reject(expense.id)} disabled={rejecting}>
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function ExpenseList({ status }: { status?: ExpenseStatus }) {
  const { data: expenses = [], isLoading } = useListExpenses(status)
  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
  if (!expenses.length) return <p className="text-sm text-center text-muted-foreground py-8">No expenses.</p>
  return <div>{expenses.map(e => <ExpenseRow key={e.id} expense={e} />)}</div>
}

export default function ExpensesPage() {
  return (
    <PageShell>
      <PageHeader title="Expenses" description="Track and approve business expenses.">
        <CreateExpenseDialog />
      </PageHeader>
      <Card>
        <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="PENDING">
            <TabsList className="mb-4">
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value="PENDING"><ExpenseList status="PENDING" /></TabsContent>
            <TabsContent value="APPROVED"><ExpenseList status="APPROVED" /></TabsContent>
            <TabsContent value="REJECTED"><ExpenseList status="REJECTED" /></TabsContent>
            <TabsContent value="all"><ExpenseList /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageShell>
  )
}
