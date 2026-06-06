"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type AdminOrg = {
  id: string; name: string; slug: string; status: string; createdAt: string
  subscriptionStatus: string | null; planName: string | null
}
export type SaasAnalytics = {
  totalOrgs: number; activeOrgs: number; trialOrgs: number; suspendedOrgs: number; cancelledOrgs: number
  mrr: number; arr: number; trialConversionRate: number; churnRate: number; platformGmv: number
}
export type AdminTheme = { id: string; name: string; slug: string; type: string; price: number; status: string }
export type AdminFunnelTemplate = { id: string; name: string; type: string; price: number; status: string }

async function get<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(fallback)
  return (await res.json() as ApiOk<T>).data
}
async function send<T>(url: string, method: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(e.message ?? fallback)
  }
  return (await res.json() as ApiOk<T>).data
}
const BASE = "/api/admin"

// ─── Organizations ────────────────────────────────────────────────────────────────
export function useAdminOrgs() {
  return useQuery<AdminOrg[]>({ queryKey: ["admin", "orgs"], queryFn: () => get(`${BASE}/organizations`, "Failed to load organizations") })
}
export function useOrgAction(action: "suspend" | "reactivate" | "cancel") {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send(`${BASE}/organizations/${id}/${action}`, "POST", null, `Failed to ${action}`),
    onSuccess: () => { toast.success(`Organization ${action}d`); qc.invalidateQueries({ queryKey: ["admin", "orgs"] }); qc.invalidateQueries({ queryKey: ["admin", "analytics"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Analytics ──────────────────────────────────────────────────────────────────────
export function useSaasAnalytics() {
  return useQuery<SaasAnalytics>({ queryKey: ["admin", "analytics"], queryFn: () => get(`${BASE}/analytics`, "Failed to load analytics") })
}

// ─── Marketplace catalog ──────────────────────────────────────────────────────────────
export function useAdminThemes() {
  return useQuery<AdminTheme[]>({ queryKey: ["admin", "mk", "themes"], queryFn: () => get(`${BASE}/marketplace/themes`, "Failed to load themes") })
}
export function useAdminFunnelTemplates() {
  return useQuery<AdminFunnelTemplate[]>({ queryKey: ["admin", "mk", "templates"], queryFn: () => get(`${BASE}/marketplace/funnel-templates`, "Failed to load templates") })
}
export function useCreateAdminTheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug: string; type?: string; price?: number; category?: string }) => send(`${BASE}/marketplace/themes`, "POST", data, "Failed to create theme"),
    onSuccess: () => { toast.success("Theme created"); qc.invalidateQueries({ queryKey: ["admin", "mk", "themes"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useSetThemeStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => send(`${BASE}/marketplace/themes/${id}/status`, "POST", { status }, "Failed to update theme"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mk", "themes"] }),
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useCreateAdminTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; type: string; price?: number; category?: string }) => send(`${BASE}/marketplace/funnel-templates`, "POST", data, "Failed to create template"),
    onSuccess: () => { toast.success("Template created"); qc.invalidateQueries({ queryKey: ["admin", "mk", "templates"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useSetTemplateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => send(`${BASE}/marketplace/funnel-templates/${id}/status`, "POST", { status }, "Failed to update template"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mk", "templates"] }),
    onError: (e: Error) => toast.error(e.message),
  })
}
