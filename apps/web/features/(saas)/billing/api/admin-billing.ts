"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Plan } from "./v1-billing"

type ApiOk<T> = { success: true; data: T }

export type AdminSubscriptionRow = {
  organizationId: string
  organizationName: string
  slug: string
  orgStatus: string
  subscriptionId: string | null
  status: string | null
  planId: string | null
  planName: string | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
}

export type AdminInvoice = {
  id: string
  invoiceNumber: string | null
  provider: string
  amount: number
  status: string
  paidAt: string | null
  createdAt: string
}

async function get<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(fallback)
  return (await res.json() as ApiOk<T>).data
}

async function post<T>(url: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(e.message ?? fallback)
  }
  return (await res.json() as ApiOk<T>).data
}

// ─── Plans ──────────────────────────────────────────────────────────────────

export function useAdminPlans() {
  return useQuery<Plan[]>({
    queryKey: ["admin", "plans"],
    queryFn: () => get("/api/admin/billing/plans", "Failed to load plans"),
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => post<Plan>("/api/admin/billing/plans", data, "Failed to create plan"),
    onSuccess: () => { toast.success("Plan created"); qc.invalidateQueries({ queryKey: ["admin", "plans"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/admin/billing/plans/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update plan")
      return (await res.json() as ApiOk<Plan>).data
    },
    onSuccess: () => { toast.success("Plan updated"); qc.invalidateQueries({ queryKey: ["admin", "plans"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function useAdminSubscriptions() {
  return useQuery<AdminSubscriptionRow[]>({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => get("/api/admin/billing/subscriptions", "Failed to load subscriptions"),
  })
}

export function useSetOrgStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, status }: { orgId: string; status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' }) =>
      post(`/api/admin/billing/subscriptions/${orgId}/status`, { status }, "Failed to update status"),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useManualActivate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, planId }: { orgId: string; planId: string }) =>
      post(`/api/admin/billing/subscriptions/${orgId}/activate`, { planId }, "Failed to activate"),
    onSuccess: () => { toast.success("Subscription activated"); qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
