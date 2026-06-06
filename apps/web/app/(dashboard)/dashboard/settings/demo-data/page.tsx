"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Database, PackageOpen } from "lucide-react"
import { useDemoDatasets, useDemoImports, useImportDataset, useClearImport } from "@/features/(saas)/organization/api/v1-demo"

const fmt = (d: string) => new Date(d).toLocaleString()

export default function DemoDataPage() {
  const { data: datasets = [], isLoading } = useDemoDatasets()
  const { data: imports = [] } = useDemoImports()
  const importDs = useImportDataset()
  const clear = useClearImport()

  return (
    <PageShell>
      <PageHeader title="Demo Data" description="Import curated sample data to explore the platform. Clear it anytime — only imported records are removed." />

      <section className="space-y-2">
        <h2 className="font-semibold">Available datasets</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : !datasets.length ? (
          <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed">
            <div className="text-center space-y-2"><Database className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No datasets available.</p></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map(d => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{d.name}</CardTitle>
                    {d.businessType && <Badge variant="outline">{d.businessType}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {d.description && <p>{d.description}</p>}
                  <Button size="sm" disabled={importDs.isPending} onClick={() => importDs.mutate(d.id)}>Import</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Imports</h2>
        {!imports.length ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed">
            <div className="text-center space-y-2"><PackageOpen className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No imports yet.</p></div>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Dataset</TableHead><TableHead>When</TableHead><TableHead className="text-right">Categories</TableHead><TableHead className="text-right">Products</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {imports.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.datasetName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmt(i.createdAt)}</TableCell>
                    <TableCell className="text-right">{i.categoryCount}</TableCell>
                    <TableCell className="text-right">{i.productCount}</TableCell>
                    <TableCell><Badge variant={i.status === "COMPLETED" ? "default" : "secondary"}>{i.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {i.status === "COMPLETED" && <Button size="sm" variant="outline" disabled={clear.isPending} onClick={() => clear.mutate(i.id)}>Clear</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </PageShell>
  )
}
