"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminOrgs, useOrgAction } from "@/features/(saas)/platform/api/admin-platform"

const VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default", TRIAL: "secondary", EXPIRED: "outline", SUSPENDED: "destructive", CANCELLED: "destructive",
}

export default function OrganizationsPage() {
  const { data: orgs = [], isLoading } = useAdminOrgs()
  const suspend = useOrgAction("suspend")
  const reactivate = useOrgAction("reactivate")
  const cancel = useOrgAction("cancel")

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-sm text-muted-foreground">All tenant organizations on the platform. Suspend, reactivate or cancel.</p>
      </div>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {orgs.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-muted-foreground">{o.slug}</TableCell>
                  <TableCell>{o.planName ?? "—"}{o.subscriptionStatus ? ` (${o.subscriptionStatus})` : ""}</TableCell>
                  <TableCell><Badge variant={VARIANT[o.status] ?? "outline"}>{o.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      {o.status === "SUSPENDED"
                        ? <Button size="sm" variant="outline" onClick={() => reactivate.mutate(o.id)}>Reactivate</Button>
                        : <Button size="sm" variant="outline" disabled={o.status === "CANCELLED"} onClick={() => suspend.mutate(o.id)}>Suspend</Button>}
                      <Button size="sm" variant="ghost" disabled={o.status === "CANCELLED"} onClick={() => cancel.mutate(o.id)}>Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
