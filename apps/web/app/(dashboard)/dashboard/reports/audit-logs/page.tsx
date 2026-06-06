"use client"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuditLogs } from "@/features/(erp-core)/notifications/api/v1-notifications"

const fmt = (d: string) => new Date(d).toLocaleString()

export default function AuditLogsPage() {
  const { data: logs = [], isLoading } = useAuditLogs()
  return (
    <PageShell>
      <PageHeader title="Audit Logs" description="Immutable record of changes across the organization (most recent first)." />
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !logs.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Entity</TableHead><TableHead>Action</TableHead><TableHead>Actor</TableHead><TableHead>Changes</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{fmt(l.createdAt)}</TableCell>
                  <TableCell><span className="font-mono text-xs">{l.entityType}</span></TableCell>
                  <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{l.actorId ?? "system"}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={l.changes ?? ""}>{l.changes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  )
}
