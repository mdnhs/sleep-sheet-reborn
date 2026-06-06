"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGrowthOverview } from "@/features/(growth)/growth/api/v1-growth"

const taka = (n: number) => `৳${n.toLocaleString()}`

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground font-normal">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  )
}

export default function GrowthAnalyticsPage() {
  const { data, isLoading } = useGrowthOverview()
  return (
    <PageShell>
      <PageHeader title="Growth Analytics" description="Campaign & funnel performance: visits, conversions, conversion rate, revenue." />
      {isLoading || !data ? <Skeleton className="h-64 rounded-xl" /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Metric label="Campaigns" value={String(data.campaigns.length)} />
            <Metric label="Funnels" value={String(data.funnels.length)} />
            <Metric label="Attributed Revenue" value={taka(data.totalRevenue)} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Campaigns</CardTitle></CardHeader>
            <CardContent>
              {!data.campaigns.length ? <p className="text-sm text-muted-foreground py-4 text-center">No campaigns.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Visits</TableHead><TableHead className="text-right">Conversions</TableHead><TableHead className="text-right">CVR</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.campaigns.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                        <TableCell className="text-right">{c.visits}</TableCell>
                        <TableCell className="text-right">{c.conversions}</TableCell>
                        <TableCell className="text-right">{c.conversionRate}%</TableCell>
                        <TableCell className="text-right">{taka(c.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Funnels</CardTitle></CardHeader>
            <CardContent>
              {!data.funnels.length ? <p className="text-sm text-muted-foreground py-4 text-center">No funnels.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Visitors</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">CVR</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.funnels.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{f.type}</span></TableCell>
                        <TableCell className="text-right">{f.visitors}</TableCell>
                        <TableCell className="text-right">{f.orders}</TableCell>
                        <TableCell className="text-right">{f.conversionRate}%</TableCell>
                        <TableCell className="text-right">{taka(f.revenue)}</TableCell>
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
