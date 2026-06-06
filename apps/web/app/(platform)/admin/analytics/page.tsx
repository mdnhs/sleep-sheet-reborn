"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSaasAnalytics } from "@/features/(saas)/platform/api/admin-platform"

const taka = (n: number) => `৳${(n / 100).toLocaleString()}`

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground font-normal">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p>{hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}</CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useSaasAnalytics()
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">SaaS Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform-wide revenue and tenant metrics, derived live.</p>
      </div>
      {isLoading || !data ? <Skeleton className="h-64 rounded-xl" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="MRR" value={taka(data.mrr)} />
            <Metric label="ARR" value={taka(data.arr)} />
            <Metric label="Platform GMV" value={taka(data.platformGmv)} />
            <Metric label="Total Orgs" value={String(data.totalOrgs)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Active" value={String(data.activeOrgs)} />
            <Metric label="Trial" value={String(data.trialOrgs)} />
            <Metric label="Suspended" value={String(data.suspendedOrgs)} />
            <Metric label="Cancelled" value={String(data.cancelledOrgs)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Trial Conversion" value={`${data.trialConversionRate}%`} hint="active / (active + trial)" />
            <Metric label="Churn" value={`${data.churnRate}%`} hint="cancelled / total" />
          </div>
        </>
      )}
    </div>
  )
}
