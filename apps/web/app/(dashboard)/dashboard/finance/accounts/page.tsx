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
import { useListAccounts, useCreateAccount, useUpdateAccount, type AccountType } from "@/features/(erp-core)/finance/api/v1-finance"
import { Plus, Wallet, CreditCard } from "lucide-react"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

const ACCOUNT_TYPES: AccountType[] = ['CASH', 'BANK', 'MOBILE_BANKING', 'DIGITAL_WALLET']

function CreateAccountDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("CASH")
  const [opening, setOpening] = useState("")
  const { mutate: create, isPending } = useCreateAccount()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-1.5"><Plus className="w-4 h-4" />New Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Account</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input placeholder="e.g. Main Cash, bKash Business" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${type === t ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Opening Balance (৳)</Label>
            <Input type="number" min="0" placeholder="0" value={opening} onChange={e => setOpening(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={isPending || !name}
            onClick={() => {
              create({ name, type, openingBalance: opening ? Math.round(Number(opening) * 100) : 0 }, {
                onSuccess: () => { setOpen(false); setName(""); setOpening("") },
              })
            }}
          >
            {isPending ? "Creating…" : "Create Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useListAccounts()
  const { mutate: update } = useUpdateAccount()

  const totalBalance = accounts.filter(a => a.status === 'ACTIVE').reduce((s, a) => s + a.currentBalance, 0)

  return (
    <PageShell>
      <PageHeader title="Accounts" description="Manage cash, bank, and mobile banking accounts.">
        <CreateAccountDialog />
      </PageHeader>

      <div className="rounded-lg bg-muted/50 border px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total Balance (Active Accounts)</p>
        <p className="text-xl font-bold">{fmt(totalBalance)}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !accounts.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2">
            <Wallet className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No accounts yet. Create one to start tracking finances.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <Card key={acc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-base">{acc.name}</CardTitle>
                  </div>
                  <Badge variant={acc.status === 'ACTIVE' ? 'default' : 'secondary'}>{acc.status}</Badge>
                </div>
                <Badge variant="outline" className="w-fit text-xs">{acc.type.replace(/_/g, ' ')}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className={`text-2xl font-bold ${acc.currentBalance < 0 ? 'text-destructive' : ''}`}>{fmt(acc.currentBalance)}</p>
                </div>
                <p className="text-xs text-muted-foreground">Opening: {fmt(acc.openingBalance)}</p>
                {acc.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => update({ id: acc.id, status: 'INACTIVE' })}
                  >
                    Deactivate
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
