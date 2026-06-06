"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED'
export type CampaignType = 'PRODUCT' | 'CATEGORY' | 'SEASONAL'
export type FunnelType = 'SINGLE' | 'MULTI' | 'BUNDLE' | 'COD' | 'LEAD' | 'UPSELL' | 'DOWNSELL'
export type StepType = 'LANDING' | 'UPSELL' | 'DOWNSELL' | 'CHECKOUT' | 'THANKYOU'

export type Campaign = {
  id: string; organizationId: string; name: string; slug: string; type: CampaignType
  status: CampaignStatus; startAt: string | null; endAt: string | null; createdAt: string; updatedAt: string
}
export type Stats = { visits: number; conversions: number; revenue: number; conversionRate: number }
export type CampaignDetail = Campaign & { products: { id: string; variantId: string }[]; stats: Stats }
export type FunnelTemplate = { id: string; name: string; type: FunnelType; category: string | null }
export type Funnel = {
  id: string; organizationId: string; templateId: string | null; name: string; slug: string
  type: FunnelType; config: string | null; status: CampaignStatus; createdAt: string; updatedAt: string
}
export type FunnelStep = { id: string; funnelId: string; type: StepType; position: number; config: string | null }
export type FunnelStats = { visitors: number; orders: number; revenue: number; conversionRate: number }
export type FunnelDetail = Funnel & { steps: FunnelStep[]; stats: FunnelStats }
export type GrowthOverview = {
  campaigns: Array<{ id: string; name: string; status: CampaignStatus } & Stats>
  funnels: Array<{ id: string; name: string; type: FunnelType; status: CampaignStatus } & FunnelStats>
  totalRevenue: number
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
const BASE = "/api/v1/growth"

// ─── Campaigns ──────────────────────────────────────────────────────────────────────
export function useCampaigns() {
  return useQuery<Campaign[]>({ queryKey: ["v1", "growth", "campaigns"], queryFn: () => get(`${BASE}/campaigns`, "Failed to load campaigns") })
}
export function useCampaign(id: string | null) {
  return useQuery<CampaignDetail>({ enabled: !!id, queryKey: ["v1", "growth", "campaigns", id], queryFn: () => get(`${BASE}/campaigns/${id}`, "Failed to load campaign") })
}
export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug?: string; type?: CampaignType }) => send<Campaign>(`${BASE}/campaigns`, "POST", data, "Failed to create campaign"),
    onSuccess: () => { toast.success("Campaign created"); qc.invalidateQueries({ queryKey: ["v1", "growth", "campaigns"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Campaign>) => send<Campaign>(`${BASE}/campaigns/${id}`, "PATCH", data, "Failed to update campaign"),
    onSuccess: () => { toast.success("Campaign updated"); qc.invalidateQueries({ queryKey: ["v1", "growth", "campaigns"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Funnels ────────────────────────────────────────────────────────────────────────
export function useFunnelTemplates() {
  return useQuery<FunnelTemplate[]>({ queryKey: ["v1", "growth", "funnel-templates"], queryFn: () => get(`${BASE}/funnel-templates`, "Failed to load templates") })
}
export function useFunnels() {
  return useQuery<Funnel[]>({ queryKey: ["v1", "growth", "funnels"], queryFn: () => get(`${BASE}/funnels`, "Failed to load funnels") })
}
export function useFunnel(id: string | null) {
  return useQuery<FunnelDetail>({ enabled: !!id, queryKey: ["v1", "growth", "funnels", id], queryFn: () => get(`${BASE}/funnels/${id}`, "Failed to load funnel") })
}
export function useCreateFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug?: string; templateId?: string; type?: FunnelType }) => send<Funnel>(`${BASE}/funnels`, "POST", data, "Failed to create funnel"),
    onSuccess: () => { toast.success("Funnel created"); qc.invalidateQueries({ queryKey: ["v1", "growth", "funnels"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Funnel>) => send<Funnel>(`${BASE}/funnels/${id}`, "PATCH", data, "Failed to update funnel"),
    onSuccess: (_d, v) => { toast.success("Funnel updated"); qc.invalidateQueries({ queryKey: ["v1", "growth", "funnels"] }); qc.invalidateQueries({ queryKey: ["v1", "growth", "funnels", v.id] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useAddStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ funnelId, type }: { funnelId: string; type: StepType }) => send<FunnelStep>(`${BASE}/funnels/${funnelId}/steps`, "POST", { type }, "Failed to add step"),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["v1", "growth", "funnels", v.funnelId] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useDeleteStep(funnelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send<{ id: string }>(`${BASE}/funnel-steps/${id}`, "DELETE", null, "Failed to delete step"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["v1", "growth", "funnels", funnelId] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Analytics ──────────────────────────────────────────────────────────────────────
export function useGrowthOverview() {
  return useQuery<GrowthOverview>({ queryKey: ["v1", "growth", "analytics"], queryFn: () => get(`${BASE}/analytics`, "Failed to load analytics") })
}
