"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type Notification = {
  id: string; organizationId: string; userId: string | null; type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  title: string; body: string | null; entityType: string | null; entityId: string | null; read: boolean; createdAt: string
}
export type Feed = { items: Notification[]; unread: number }
export type AuditLog = {
  id: string; organizationId: string; entityType: string; entityId: string; action: string
  actorId: string | null; changes: string | null; createdAt: string
}

async function get<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(fallback)
  return (await res.json() as ApiOk<T>).data
}
async function send<T>(url: string, method: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) { const e = await res.json().catch(() => ({})) as { message?: string }; throw new Error(e.message ?? fallback) }
  return (await res.json() as ApiOk<T>).data
}

// ─── Notifications ─────────────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery<Feed>({ queryKey: ["v1", "notifications"], queryFn: () => get("/api/v1/notifications", "Failed to load notifications") })
}
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send(`/api/v1/notifications/${id}/read`, "POST", null, "Failed to mark read"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["v1", "notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => send(`/api/v1/notifications/read-all`, "POST", null, "Failed to mark all read"),
    onSuccess: () => { toast.success("All marked read"); qc.invalidateQueries({ queryKey: ["v1", "notifications"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Audit logs ─────────────────────────────────────────────────────────────────────
export function useAuditLogs() {
  return useQuery<AuditLog[]>({ queryKey: ["v1", "audit-logs"], queryFn: () => get("/api/v1/audit-logs", "Failed to load audit logs") })
}
