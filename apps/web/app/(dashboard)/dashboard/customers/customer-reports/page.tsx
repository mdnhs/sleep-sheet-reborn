"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCustomerReports } from "@/features/(erp-core)/customers/api/v1-customers"

const taka = (n: number) => `৳${n.toLocaleString()}`
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—")

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground font-normal">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  )
}

export default function CustomerReportsPage() {
  const { data, isLoading } = useCustomerReports()
  return (
    <PageShell>
      <PageHeader title="Customer Reports" description="Lifetime value, top customers and channel-wide spending." />
      {isLoading || !data ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Metric label="Total Customers" value={String(data.totalCustomers)} />
            <Metric label="Active Customers" value={String(data.activeCustomers)} />
            <Metric label="Total Revenue" value={taka(data.totalRevenue)} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Top Customers by Lifetime Value</CardTitle></CardHeader>
            <CardContent>
              {!data.topCustomers.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No purchase data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead><TableHead>Phone</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead className="text-right">AOV</TableHead>
                      <TableHead>Last Buy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topCustomers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="text-right">{c.totalOrders}</TableCell>
                        <TableCell className="text-right">{taka(c.totalSpent)}</TableCell>
                        <TableCell className="text-right">{taka(c.averageOrderValue)}</TableCell>
                        <TableCell>{fmt(c.lastPurchaseAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}
