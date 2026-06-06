"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSalesSummary, useSalesByChannel, useOutletPerformance } from "@/features/(erp-core)/reports/api/v1-reports"

const taka = (n: number) => `৳${n.toLocaleString()}`

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground font-normal">{label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>
}

export default function SalesReportsPage() {
  const { data: sum, isLoading } = useSalesSummary()
  const { data: channels = [] } = useSalesByChannel()
  const { data: outlets = [] } = useOutletPerformance()
  return (
    <PageShell>
      <PageHeader title="Sales Reports" description="Revenue across online orders and POS — by channel and outlet." />
      {isLoading || !sum ? <Skeleton className="h-64 rounded-xl" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Total Revenue" value={taka(sum.totalRevenue)} />
            <Metric label="Total Orders" value={String(sum.totalOrders)} />
            <Metric label="Avg Order Value" value={taka(sum.averageOrderValue)} />
            <Metric label="Online / POS" value={`${taka(sum.orderRevenue)} / ${taka(sum.posRevenue)}`} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">By Channel</CardTitle></CardHeader>
            <CardContent>
              {!channels.length ? <p className="text-sm text-muted-foreground py-4 text-center">No sales.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Channel</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                  <TableBody>{channels.map(c => <TableRow key={c.channel}><TableCell className="font-medium">{c.channel}</TableCell><TableCell className="text-right">{c.orders}</TableCell><TableCell className="text-right">{taka(c.revenue)}</TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">By Outlet</CardTitle></CardHeader>
            <CardContent>
              {!outlets.length ? <p className="text-sm text-muted-foreground py-4 text-center">No outlet sales.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Outlet</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                  <TableBody>{outlets.map(o => <TableRow key={o.locationId}><TableCell className="font-medium">{o.locationName}</TableCell><TableCell className="text-right">{o.orders}</TableCell><TableCell className="text-right">{taka(o.revenue)}</TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}
