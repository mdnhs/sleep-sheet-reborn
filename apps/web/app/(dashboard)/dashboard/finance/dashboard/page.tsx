"use client"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinanceSummary, useListTransactions } from "@/features/(erp-core)/finance/api/v1-finance"
import { format } from "date-fns"
import { TrendingUp, TrendingDown, Wallet, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

export default function FinanceDashboardPage() {
  const { data: summary, isLoading } = useFinanceSummary()
  const { data: recentTx = [] } = useListTransactions()

  if (isLoading) return (
    <PageShell>
      <PageHeader title="Finance Overview" description="Business financial summary." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
    </PageShell>
  )

  return (
    <PageShell>
      <PageHeader title="Finance Overview" description="Business financial summary and account balances." />
      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Total Balance</p><p className="text-2xl font-bold mt-1">{fmt(summary.totalBalance)}</p></div><div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30"><Wallet className="w-5 h-5 text-blue-600" /></div></div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Total Income</p><p className="text-2xl font-bold mt-1 text-green-600">{fmt(summary.totalIncome)}</p></div><div className="rounded-lg p-2 bg-green-50 dark:bg-green-950/30"><TrendingUp className="w-5 h-5 text-green-600" /></div></div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold mt-1 text-red-500">{fmt(summary.totalExpenses)}</p></div><div className="rounded-lg p-2 bg-red-50 dark:bg-red-950/30"><TrendingDown className="w-5 h-5 text-red-500" /></div></div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Net Profit</p><p className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(summary.netProfit)}</p></div><div className={`rounded-lg p-2 ${summary.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>{summary.netProfit >= 0 ? <ArrowUpRight className="w-5 h-5 text-green-600" /> : <ArrowDownRight className="w-5 h-5 text-red-500" />}</div></div></CardContent></Card>
          </div>

          {summary.pendingExpenseCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
              <span className="text-yellow-800 dark:text-yellow-300">{summary.pendingExpenseCount} expense{summary.pendingExpenseCount > 1 ? 's' : ''} awaiting approval.</span>
              <Link href="/dashboard/finance/expenses" className="underline font-medium ml-auto text-yellow-800 dark:text-yellow-300">Review</Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Account Balances</CardTitle></CardHeader>
              <CardContent>
                {!summary.accounts.length ? (
                  <p className="text-sm text-center text-muted-foreground py-6">No accounts. <Link href="/dashboard/finance/accounts" className="underline">Create one</Link>.</p>
                ) : (
                  <div className="space-y-2">
                    {summary.accounts.filter(a => a.status === 'ACTIVE').map(acc => (
                      <div key={acc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div><p className="text-sm font-medium">{acc.name}</p><Badge variant="secondary" className="text-xs mt-0.5">{acc.type.replace(/_/g, ' ')}</Badge></div>
                        <p className={`font-semibold ${acc.currentBalance < 0 ? 'text-destructive' : ''}`}>{fmt(acc.currentBalance)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <Link href="/dashboard/finance/transactions" className="text-xs text-muted-foreground hover:underline">View all</Link>
              </CardHeader>
              <CardContent>
                {!recentTx.length ? (
                  <p className="text-sm text-center text-muted-foreground py-6">No transactions yet.</p>
                ) : (
                  <div>
                    {recentTx.slice(0, 8).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0"><p className="font-medium truncate">{tx.note ?? tx.type}</p><p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, HH:mm")}</p></div>
                        <p className={`font-semibold shrink-0 ml-3 ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>{tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageShell>
  )
}
