"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useListTransactions } from "@/features/(erp-core)/finance/api/v1-finance"
import { format } from "date-fns"
import { ArrowUpRight } from "lucide-react"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

export default function IncomePage() {
  const { data: all = [], isLoading } = useListTransactions()
  const income = all.filter(tx => tx.amount > 0)
  const total = income.reduce((s, t) => s + t.amount, 0)

  return (
    <PageShell>
      <PageHeader title="Income" description="All credit transactions — revenue from sales, payments, and adjustments." />

      <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-green-700 dark:text-green-400">Total Income</p>
        <p className="text-xl font-bold text-green-700 dark:text-green-400">{fmt(total)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Income Transactions
            {income.length > 0 && <Badge variant="secondary">{income.length} entries</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
          ) : !income.length ? (
            <p className="text-sm text-center text-muted-foreground py-8">No income transactions yet.</p>
          ) : (
            <div>
              {income.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-1.5 bg-green-50 dark:bg-green-950/30">
                      <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{tx.note ?? tx.type.replace(/_/g, ' ')}</p>
                        <Badge variant="outline" className="text-xs">{tx.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">+{fmt(tx.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
