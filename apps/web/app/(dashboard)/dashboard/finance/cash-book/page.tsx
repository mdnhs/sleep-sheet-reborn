"use client"
import { useState } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { useCashBook, useListAccounts } from "@/features/(erp-core)/finance/api/v1-finance"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

export default function CashBookPage() {
  const [accountId, setAccountId] = useState("")
  const { data: entries = [], isLoading } = useCashBook(accountId || undefined)
  const { data: accounts = [] } = useListAccounts()

  return (
    <PageShell>
      <PageHeader title="Cash Book" description="Chronological money movement with running balance." />

      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Account:</Label>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
        >
          <option value="">All accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Cash Book
            {entries.length > 0 && <Badge variant="secondary">{entries.length} entries</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
          ) : !entries.length ? (
            <p className="text-sm text-center text-muted-foreground py-8">No entries. Select an account or record transactions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Description</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4 text-right">Debit</th>
                    <th className="pb-2 pr-4 text-right">Credit</th>
                    <th className="pb-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{format(new Date(entry.createdAt), "MMM d, HH:mm")}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          {entry.amount >= 0
                            ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            : <ArrowDownRight className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          {entry.note ?? entry.type.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4"><Badge variant="outline" className="text-xs">{entry.type}</Badge></td>
                      <td className="py-2.5 pr-4 text-right text-red-500">{entry.amount < 0 ? fmt(Math.abs(entry.amount)) : '—'}</td>
                      <td className="py-2.5 pr-4 text-right text-green-600">{entry.amount >= 0 ? fmt(entry.amount) : '—'}</td>
                      <td className={`py-2.5 text-right font-semibold ${entry.runningBalance < 0 ? 'text-destructive' : ''}`}>{fmt(entry.runningBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
