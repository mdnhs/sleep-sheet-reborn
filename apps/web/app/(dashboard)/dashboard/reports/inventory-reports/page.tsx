"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventoryValuation, useLowStock, useMovementSummary } from "@/features/(erp-core)/reports/api/v1-reports"

const taka = (n: number) => `৳${n.toLocaleString()}`

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground font-normal">{label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>
}

export default function InventoryReportsPage() {
  const { data: val, isLoading } = useInventoryValuation()
  const { data: low = [] } = useLowStock(5)
  const { data: movements = [] } = useMovementSummary()
  return (
    <PageShell>
      <PageHeader title="Inventory Reports" description="Stock valuation, low-stock alerts and movement summary." />
      {isLoading || !val ? <Skeleton className="h-64 rounded-xl" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Total Units" value={val.totalUnits.toLocaleString()} />
            <Metric label="Cost Value" value={taka(val.costValue)} />
            <Metric label="Retail Value" value={taka(val.retailValue)} />
            <Metric label="Potential Margin" value={taka(val.potentialMargin)} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Low Stock (≤ 5)</CardTitle></CardHeader>
            <CardContent>
              {!low.length ? <p className="text-sm text-muted-foreground py-4 text-center">All stock healthy.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Product</TableHead><TableHead>Outlet</TableHead><TableHead className="text-right">Qty</TableHead></TableRow></TableHeader>
                  <TableBody>{low.map((r, i) => <TableRow key={i}><TableCell className="font-mono text-sm">{r.sku}</TableCell><TableCell>{r.name}</TableCell><TableCell className="text-muted-foreground">{r.locationName}</TableCell><TableCell className="text-right"><Badge variant="destructive">{r.quantity}</Badge></TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Movement Summary</CardTitle></CardHeader>
            <CardContent>
              {!movements.length ? <p className="text-sm text-muted-foreground py-4 text-center">No movements.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Type</TableHead><TableHead className="text-right">Entries</TableHead><TableHead className="text-right">Net Qty</TableHead></TableRow></TableHeader>
                  <TableBody>{movements.map(m => <TableRow key={m.movementType}><TableCell className="font-medium">{m.movementType.replace(/_/g, " ")}</TableCell><TableCell className="text-right">{m.count}</TableCell><TableCell className="text-right">{m.netQuantity}</TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}
