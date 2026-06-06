"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTopProducts } from "@/features/(erp-core)/reports/api/v1-reports"

const taka = (n: number) => `৳${n.toLocaleString()}`

export default function ProductReportsPage() {
  const { data: top = [], isLoading } = useTopProducts()
  return (
    <PageShell>
      <PageHeader title="Product Reports" description="Best-selling products by units sold across online + POS." />
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
        <Card>
          <CardContent className="pt-6">
            {!top.length ? <p className="text-sm text-muted-foreground py-6 text-center">No sales yet.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead className="w-10">#</TableHead><TableHead>SKU</TableHead><TableHead>Product</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                <TableBody>{top.map((p, i) => <TableRow key={p.variantId}><TableCell className="text-muted-foreground">{i + 1}</TableCell><TableCell className="font-mono text-sm">{p.sku}</TableCell><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right">{p.units}</TableCell><TableCell className="text-right">{taka(p.revenue)}</TableCell></TableRow>)}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
