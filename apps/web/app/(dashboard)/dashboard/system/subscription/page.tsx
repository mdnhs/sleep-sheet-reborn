"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useSubscription, usePlans, useUsage, useInvoices, useCheckout,
  type SubStatus, type Plan, type Provider,
} from "@/features/(saas)/billing/api/v1-billing"
import { Check } from "lucide-react"

function fmt(n: number) { return n === 0 ? "Free" : `৳${(n / 100).toLocaleString()}` }

const STATUS_VARIANT: Record<SubStatus, "default" | "secondary" | "destructive" | "outline"> = {
  TRIAL: "secondary", ACTIVE: "default", EXPIRED: "destructive", SUSPENDED: "destructive", CANCELLED: "outline",
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit >= 1_000_000_000
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))
  const over = !unlimited && used >= limit
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-destructive font-medium" : ""}>{used}{unlimited ? "" : ` / ${limit}`}</span>
      </div>
      {!unlimited && (
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full ${over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

function PlanCard({ plan, current, onChoose, pending }: { plan: Plan; current: boolean; onChoose: () => void; pending: boolean }) {
  return (
    <Card className={current ? "border-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {current && <Badge>Current</Badge>}
        </div>
        <p className="text-2xl font-bold">{fmt(plan.price)}<span className="text-sm font-normal text-muted-foreground">/{plan.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span></p>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex gap-2"><Check className="w-4 h-4 text-primary" />{plan.limitProducts >= 1e9 ? "Unlimited" : plan.limitProducts.toLocaleString()} products</li>
          <li className="flex gap-2"><Check className="w-4 h-4 text-primary" />{plan.limitOutlets >= 1e9 ? "Unlimited" : plan.limitOutlets} outlets</li>
          <li className="flex gap-2"><Check className="w-4 h-4 text-primary" />{plan.limitUsers >= 1e9 ? "Unlimited" : plan.limitUsers} users</li>
          <li className="flex gap-2"><Check className="w-4 h-4 text-primary" />{plan.limitOrdersPerMonth >= 1e9 ? "Unlimited" : plan.limitOrdersPerMonth.toLocaleString()} orders/mo</li>
        </ul>
        {!current && plan.price > 0 && (
          <Button className="w-full mt-2" disabled={pending} onClick={onChoose}>
            {pending ? "Starting…" : "Upgrade"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function SubscriptionPage() {
  const { data: sub, isLoading } = useSubscription()
  const { data: plans = [] } = usePlans()
  const { data: usageData } = useUsage()
  const { data: invoices = [] } = useInvoices()
  const { mutate: checkout, isPending } = useCheckout()

  const provider: Provider = "bKash"

  return (
    <PageShell>
      <PageHeader title="Subscription & Billing" description="Manage your plan, usage, and invoices." />

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Plan: {sub?.plan?.name ?? "—"}</CardTitle>
              {sub?.subscription && <Badge variant={STATUS_VARIANT[sub.subscription.status]}>{sub.subscription.status}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            {sub?.subscription?.status === 'TRIAL' && sub.subscription.trialEndsAt && (
              <p>Trial ends {new Date(sub.subscription.trialEndsAt).toLocaleDateString()}</p>
            )}
            {sub?.subscription?.currentPeriodEnd && (
              <p>Renews {new Date(sub.subscription.currentPeriodEnd).toLocaleDateString()}</p>
            )}
            {(sub?.subscription?.status === 'EXPIRED' || sub?.subscription?.status === 'SUSPENDED') && (
              <p className="text-destructive">Your subscription is {sub.subscription.status.toLowerCase()} — writes are blocked. Upgrade to restore access.</p>
            )}
          </CardContent>
        </Card>
      )}

      {usageData?.limits && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Usage</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UsageBar label="Products" used={usageData.usage.products} limit={usageData.limits.products} />
            <UsageBar label="Outlets" used={usageData.usage.outlets} limit={usageData.limits.outlets} />
            <UsageBar label="Users" used={usageData.usage.users} limit={usageData.limits.users} />
            <UsageBar label="Orders this month" used={usageData.usage.ordersThisMonth} limit={usageData.limits.ordersThisMonth} />
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(p => (
            <PlanCard
              key={p.id}
              plan={p}
              current={sub?.plan?.id === p.id}
              pending={isPending}
              onChoose={() => checkout({ planId: p.id, provider })}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b"><h3 className="font-semibold text-sm">Invoices</h3></div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoiceNumber ?? inv.id.slice(0, 8)}</TableCell>
                <TableCell>{inv.provider}</TableCell>
                <TableCell className="text-right">{fmt(inv.amount)}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === 'PAID' ? 'default' : inv.status === 'FAILED' ? 'destructive' : 'secondary'}>{inv.status}</Badge>
                </TableCell>
                <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {!invoices.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No invoices yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  )
}
