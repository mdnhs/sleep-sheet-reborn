"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type SubStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'
export type Provider = 'bKash' | 'Nagad' | 'SSLCommerz'

export type Plan = {
  id: string
  name: string
  billingCycle: 'MONTHLY' | 'YEARLY'
  price: number
  limitUsers: number
  limitOutlets: number
  limitWarehouses: number
  limitProducts: number
  limitOrdersPerMonth: number
  limitThemes: number
  limitFunnels: number
  featureFlags: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export type Subscription = {
  id: string
  organizationId: string
  planId: string
  status: SubStatus
  trialEndsAt: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  graceEndsAt: string | null
  autoRenew: boolean
}

export type Invoice = {
  id: string
  invoiceNumber: string | null
  provider: string
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paidAt: string | null
  createdAt: string
}

export type Usage = {
  usage: { products: number; outlets: number; warehouses: number; users: number; ordersThisMonth: number }
  limits: { products: number; outlets: number; warehouses: number; users: number; ordersThisMonth: number } | null
}

async function get<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(fallback)
  return (await res.json() as ApiOk<T>).data
}

export function useSubscription() {
  return useQuery<{ subscription: Subscription | null; plan: Plan | null }>({
    queryKey: ["v1", "billing", "subscription"],
    queryFn: () => get("/api/v1/billing/subscription", "Failed to load subscription"),
  })
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["v1", "billing", "plans"],
    queryFn: () => get("/api/v1/billing/plans", "Failed to load plans"),
  })
}

export function useUsage() {
  return useQuery<Usage>({
    queryKey: ["v1", "billing", "usage"],
    queryFn: () => get("/api/v1/billing/usage", "Failed to load usage"),
  })
}

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["v1", "billing", "invoices"],
    queryFn: () => get("/api/v1/billing/invoices", "Failed to load invoices"),
  })
}

export function useCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { planId: string; provider: Provider }) => {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(e.message ?? "Checkout failed")
      }
      return (await res.json() as ApiOk<{ invoice: Invoice; checkoutUrl: string }>).data
    },
    onSuccess: () => {
      toast.success("Invoice created — complete payment to activate")
      qc.invalidateQueries({ queryKey: ["v1", "billing"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
