"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { usePnL } from "@/features/(erp-core)/finance/api/v1-finance"
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

export default function ProfitAndLossPage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [applied, setApplied] = useState<{ from?: string; to?: string }>({})

  const { data: pnl, isLoading } = usePnL(applied.from, applied.to)

  return (
    <PageShell>
      <PageHeader title="Profit & Loss" description="Revenue vs expenses for any period." />

      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" className="w-40" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" className="w-40" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setApplied({ from: from || undefined, to: to || undefined })}>
          Apply
        </Button>
        {(applied.from || applied.to) && (
          <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); setApplied({}) }}>Clear</Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : pnl ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold mt-1 text-green-600">{fmt(pnl.income)}</p>
                </div>
                <div className="rounded-lg p-2 bg-green-50 dark:bg-green-950/30">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-3xl font-bold mt-1 text-red-500">{fmt(pnl.expenses)}</p>
                </div>
                <div className="rounded-lg p-2 bg-red-50 dark:bg-red-950/30">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={pnl.netProfit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-3xl font-bold mt-1 ${pnl.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {fmt(pnl.netProfit)}
                  </p>
                  {pnl.income > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Margin: {((pnl.netProfit / pnl.income) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className={`rounded-lg p-2 ${pnl.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                  {pnl.netProfit >= 0
                    ? <ArrowUpRight className="w-5 h-5 text-green-600" />
                    : <ArrowDownRight className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {pnl && (
        <Card>
          <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm max-w-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Gross Revenue</span>
                <span className="font-medium text-green-600">{fmt(pnl.income)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="font-medium text-red-500">-{fmt(pnl.expenses)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold text-base">
                <span>Net Profit</span>
                <span className={pnl.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}>{fmt(pnl.netProfit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
