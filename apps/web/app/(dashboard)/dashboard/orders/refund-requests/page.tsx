"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useListOrderRefunds,
  useApproveOrderRefund,
  type OrderRefund,
  type RefundStatus,
} from "@/features/(erp-core)/orders/api/v1-orders"
import { format } from "date-fns"
import { CheckCircle } from "lucide-react"

const STATUS_VARIANT: Record<RefundStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "outline",
  REJECTED: "destructive",
}

function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
}

function RefundRow({ refund }: { refund: OrderRefund }) {
  const { mutate: approve, isPending } = useApproveOrderRefund()

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{refund.orderId.slice(0, 12)}…</TableCell>
      <TableCell>৳{(refund.amount / 100).toLocaleString()}</TableCell>
      <TableCell>{refund.method}</TableCell>
      <TableCell>{refund.reason ?? "—"}</TableCell>
      <TableCell><RefundStatusBadge status={refund.status} /></TableCell>
      <TableCell className="text-muted-foreground text-xs">{format(new Date(refund.createdAt), "MMM d, yyyy")}</TableCell>
      <TableCell className="text-right">
        {refund.status === 'PENDING' && (
          <Button size="sm" onClick={() => approve(refund.id)} disabled={isPending} className="gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            {isPending ? "Approving…" : "Approve"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function RefundRequestsPage() {
  const { data: refunds = [], isLoading } = useListOrderRefunds()

  return (
    <PageShell>
      <PageHeader title="Refund Requests" description="Review and approve customer refund requests." />

      <Card>
        <CardHeader><CardTitle>All Refunds</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))}
              {!isLoading && refunds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No refund requests.</TableCell>
                </TableRow>
              )}
              {!isLoading && refunds.map((r) => <RefundRow key={r.id} refund={r} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  )
}
