"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  useListTransactions,
  useCreateTransaction,
  useListAccounts,
  type TransactionType,
  type FinTransaction,
} from "@/features/(erp-core)/finance/api/v1-finance"
import { format } from "date-fns"
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

const TX_TYPES: TransactionType[] = ['SALE', 'PURCHASE_PAYMENT', 'CUSTOMER_PAYMENT', 'REFUND', 'EXPENSE', 'WALLET_CREDIT', 'WALLET_DEBIT', 'ADJUSTMENT']

function CreateTransactionDialog() {
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState("")
  const [type, setType] = useState<TransactionType>("ADJUSTMENT")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const { mutate: create, isPending } = useCreateTransaction()
  const { data: accounts = [] } = useListAccounts()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-1.5"><Plus className="w-4 h-4" />Record Transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Account</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
            >
              <option value="">Select account…</option>
              {accounts.filter(a => a.status === 'ACTIVE').map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={type}
              onChange={e => setType(e.target.value as TransactionType)}
            >
              {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Amount (৳) — positive = credit, negative = debit</Label>
            <Input type="number" placeholder="e.g. 500 or -200" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input placeholder="…" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={isPending || !accountId || !amount || Number(amount) === 0}
            onClick={() => {
              create({
                accountId,
                type,
                amount: Math.round(Number(amount) * 100),
                note: note || undefined,
              }, { onSuccess: () => { setOpen(false); setAmount(""); setNote("") } })
            }}
          >
            {isPending ? "Recording…" : "Record"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TransactionsPage() {
  const [accountFilter, setAccountFilter] = useState("")
  const { data: transactions = [], isLoading } = useListTransactions({ accountId: accountFilter || undefined })
  const { data: accounts = [] } = useListAccounts()

  return (
    <PageShell>
      <PageHeader title="Transactions" description="All financial transactions ledger.">
        <CreateTransactionDialog />
      </PageHeader>

      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Filter by account:</Label>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={accountFilter}
          onChange={e => setAccountFilter(e.target.value)}
        >
          <option value="">All accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction Ledger</span>
            {transactions.length > 0 && <Badge variant="secondary">{transactions.length} entries</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
          ) : !transactions.length ? (
            <p className="text-sm text-center text-muted-foreground py-8">No transactions found.</p>
          ) : (
            <div>
              {transactions.map((tx: FinTransaction) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1.5 ${tx.amount >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                      {tx.amount >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{tx.note ?? tx.type.replace(/_/g, ' ')}</p>
                        <Badge variant="outline" className="text-xs">{tx.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
