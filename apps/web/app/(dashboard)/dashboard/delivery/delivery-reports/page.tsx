"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeliveryReports } from "@/features/(erp-core)/delivery/api/v1-delivery"

export default function DeliveryReportsPage() {
  const { data, isLoading } = useDeliveryReports()
  return (
    <PageShell>
      <PageHeader title="Delivery Reports" description="Shipment volume and success metrics." />
      {isLoading || !data ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.total}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Delivered</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.delivered}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.inProgress}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Failed</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.failed}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Returned</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.returned}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Success Rate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.successRate}%</p></CardContent></Card>
        </div>
      )}
    </PageShell>
  )
}
