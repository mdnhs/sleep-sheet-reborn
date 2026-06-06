"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useAdminSubscriptions, useAdminPlans, useSetOrgStatus, useManualActivate,
} from "@/features/(saas)/billing/api/admin-billing"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  TRIAL: "secondary", ACTIVE: "default", EXPIRED: "destructive", SUSPENDED: "destructive", CANCELLED: "outline",
}

export default function SubscriptionsPage() {
  const { data: rows = [], isLoading } = useAdminSubscriptions()
  const { data: plans = [] } = useAdminPlans()
  const { mutate: setStatus } = useSetOrgStatus()
  const { mutate: activate } = useManualActivate()

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Subscription status across all tenants.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Renews / Trial</TableHead>
                <TableHead>Activate plan</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.organizationId}>
                  <TableCell>
                    <div className="font-medium">{r.organizationName}</div>
                    <div className="text-xs text-muted-foreground">{r.slug}</div>
                  </TableCell>
                  <TableCell>{r.planName ?? "—"}</TableCell>
                  <TableCell>{r.status ? <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{r.status}</Badge> : <span className="text-muted-foreground text-sm">none</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.currentPeriodEnd ? new Date(r.currentPeriodEnd).toLocaleDateString()
                      : r.trialEndsAt ? `Trial → ${new Date(r.trialEndsAt).toLocaleDateString()}` : "—"}
                  </TableCell>
                  <TableCell>
                    {r.subscriptionId && (
                      <Select onValueChange={(v) => { if (v) activate({ orgId: r.organizationId, planId: String(v) }) }}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Set plan" /></SelectTrigger>
                        <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {r.subscriptionId && r.status !== 'SUSPENDED' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus({ orgId: r.organizationId, status: 'SUSPENDED' })}>Suspend</Button>
                    )}
                    {r.subscriptionId && r.status === 'SUSPENDED' && (
                      <Button size="sm" onClick={() => setStatus({ orgId: r.organizationId, status: 'ACTIVE' })}>Reactivate</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No organizations.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
