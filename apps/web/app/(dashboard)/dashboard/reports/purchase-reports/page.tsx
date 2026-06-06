"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePurchaseSummary } from "@/features/(erp-core)/reports/api/v1-reports"

const taka = (n: number) => `৳${n.toLocaleString()}`

export default function PurchaseReportsPage() {
  const { data, isLoading } = usePurchaseSummary()
  return (
    <PageShell>
      <PageHeader title="Purchase Reports" description="Purchase spend by status and top suppliers." />
      {isLoading || !data ? <Skeleton className="h-64 rounded-xl" /> : (
        <>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground font-normal">Total Spend</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{taka(data.totalSpend)}</p></CardContent></Card>

          <Card>
            <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
            <CardContent>
              {!data.byStatus.length ? <p className="text-sm text-muted-foreground py-4 text-center">No purchases.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>{data.byStatus.map(r => <TableRow key={r.status}><TableCell><Badge variant="outline">{r.status}</Badge></TableCell><TableCell className="text-right">{r.count}</TableCell><TableCell className="text-right">{taka(r.total)}</TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Top Suppliers</CardTitle></CardHeader>
            <CardContent>
              {!data.topSuppliers.length ? <p className="text-sm text-muted-foreground py-4 text-center">No supplier data.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>{data.topSuppliers.map(r => <TableRow key={r.supplierId}><TableCell className="font-medium">{r.supplierName}</TableCell><TableCell className="text-right">{r.count}</TableCell><TableCell className="text-right">{taka(r.total)}</TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}
