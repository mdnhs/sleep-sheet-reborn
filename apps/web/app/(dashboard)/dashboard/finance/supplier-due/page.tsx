"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupplierDues } from "@/features/(erp-core)/finance/api/v1-finance"

function fmt(n: number) { return `৳${(n / 100).toLocaleString()}` }

export default function SupplierDuePage() {
  const { data: dues = [], isLoading } = useSupplierDues()
  const totalDue = dues.reduce((s, d) => s + d.due, 0)

  return (
    <PageShell>
      <PageHeader title="Supplier Due" description="Outstanding payable balances to suppliers." />

      <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-red-700 dark:text-red-400">Total Payable</p>
        <p className="text-xl font-bold text-red-700 dark:text-red-400">{fmt(totalDue)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Supplier Balances
            {dues.length > 0 && <Badge variant="secondary">{dues.length} suppliers</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
          ) : !dues.length ? (
            <p className="text-sm text-center text-muted-foreground py-8">No suppliers found.</p>
          ) : (
            <div>
              {dues.map(d => (
                <div key={d.supplierId} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{d.supplierName}</p>
                    <p className="text-xs text-muted-foreground">{d.phone}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Purchased: {fmt(d.totalPurchased)}</span>
                      <span>Paid: {fmt(d.totalPaid)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${d.due > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(d.due)}</p>
                    <p className="text-xs text-muted-foreground">{d.due > 0 ? 'outstanding' : 'settled'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
