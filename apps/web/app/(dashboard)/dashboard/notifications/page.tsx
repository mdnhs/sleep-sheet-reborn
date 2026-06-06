"use client"
import type { ReactNode } from "react"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { useNotifications, useMarkRead, useMarkAllRead, type Notification } from "@/features/(erp-core)/notifications/api/v1-notifications"

const ICON: Record<Notification["type"], ReactNode> = {
  INFO: <Info className="w-4 h-4 text-blue-500" />,
  SUCCESS: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  WARNING: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  ERROR: <XCircle className="w-4 h-4 text-red-500" />,
}
const fmt = (d: string) => new Date(d).toLocaleString()

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const items = data?.items ?? []

  return (
    <PageShell>
      <PageHeader title="Notifications" description="Activity alerts and system messages.">
        {(data?.unread ?? 0) > 0 && <Button size="sm" variant="outline" onClick={() => markAll.mutate()}>Mark all read ({data!.unread})</Button>}
      </PageHeader>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !items.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-2"><Bell className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">No notifications.</p></div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div key={n.id} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${n.read ? "" : "bg-muted/40 border-primary/30"}`}>
              <div className="pt-0.5">{ICON[n.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {!n.read && <Badge variant="secondary" className="text-[10px]">New</Badge>}
                </div>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                <p className="text-xs text-muted-foreground mt-1">{fmt(n.createdAt)}</p>
              </div>
              {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>Mark read</Button>}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
