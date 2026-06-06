"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type MarketplaceTheme = {
  id: string; name: string; slug: string; type: 'FREE' | 'PREMIUM'; category: string | null
  price: number; description: string | null; owned: boolean; installed: boolean; active: boolean; orgThemeId: string | null
}
export type MarketplaceFunnel = {
  id: string; name: string; type: string; category: string | null; price: number; owned: boolean; installs: number
}

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
const BASE = "/api/v1/marketplace"

// ─── Themes ───────────────────────────────────────────────────────────────────────
export function useMarketplaceThemes() {
  return useQuery<MarketplaceTheme[]>({ queryKey: ["v1", "marketplace", "themes"], queryFn: () => get(`${BASE}/themes`, "Failed to load themes") })
}
function useThemeAction(verb: string, path: (id: string) => string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send(path(id), "POST", null, `Failed to ${verb} theme`),
    onSuccess: () => { toast.success(`Theme ${verb}d`); qc.invalidateQueries({ queryKey: ["v1", "marketplace", "themes"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export const usePurchaseTheme = () => useThemeAction("purchase", (id) => `${BASE}/themes/${id}/purchase`)
export const useInstallTheme = () => useThemeAction("install", (id) => `${BASE}/themes/${id}/install`)
export const useActivateMarketTheme = () => useThemeAction("activate", (id) => `${BASE}/org-themes/${id}/activate`)
export const useUpdateMarketTheme = () => useThemeAction("update", (id) => `${BASE}/org-themes/${id}/update`)

// ─── Funnels ──────────────────────────────────────────────────────────────────────
export function useMarketplaceFunnels() {
  return useQuery<MarketplaceFunnel[]>({ queryKey: ["v1", "marketplace", "funnels"], queryFn: () => get(`${BASE}/funnels`, "Failed to load funnel templates") })
}
export function usePurchaseFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) => send(`${BASE}/funnels/${templateId}/purchase`, "POST", null, "Failed to purchase funnel template"),
    onSuccess: () => { toast.success("Funnel template purchased"); qc.invalidateQueries({ queryKey: ["v1", "marketplace", "funnels"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useInstallFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) => send(`${BASE}/funnels/${templateId}/install`, "POST", { name }, "Failed to install funnel"),
    onSuccess: () => { toast.success("Funnel installed"); qc.invalidateQueries({ queryKey: ["v1", "marketplace", "funnels"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
