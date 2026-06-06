"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type CustomerType = 'GUEST' | 'REGISTERED' | 'WHOLESALE' | 'CORPORATE'
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'ARCHIVED'

export type Customer = {
  id: string; organizationId: string; groupId: string | null; name: string; phone: string
  email: string | null; dateOfBirth: string | null; type: CustomerType; status: CustomerStatus
  notes: string | null; walletBalance: number; loyaltyPoints: number; createdAt: string; updatedAt: string
}
export type CustomerGroup = {
  id: string; organizationId: string; name: string; discountPercent: number
  status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
export type CustomerAddress = {
  id: string; customerId: string; type: 'BILLING' | 'SHIPPING'; name: string | null; phone: string | null
  addressLine: string; area: string | null; city: string | null; postalCode: string | null; isDefault: boolean
}
export type PurchaseStats = {
  totalOrders: number; totalSpent: number; averageOrderValue: number; lastPurchaseAt: string | null
}
export type CustomerDetail = Customer & { stats: PurchaseStats; addresses: CustomerAddress[] }
export type WalletTxn = {
  id: string; customerId: string; type: 'CREDIT' | 'DEBIT'; amount: number; balanceAfter: number
  source: string; note: string | null; createdAt: string
}
export type LoyaltyTxn = {
  id: string; customerId: string; type: 'EARN' | 'REDEEM' | 'REVERSE'; points: number; balanceAfter: number
  source: string; note: string | null; createdAt: string
}
export type CustomerReports = {
  totalCustomers: number; activeCustomers: number; totalRevenue: number
  topCustomers: Array<{
    id: string; name: string; phone: string; status: CustomerStatus; walletBalance: number
    loyaltyPoints: number; totalOrders: number; totalSpent: number; averageOrderValue: number; lastPurchaseAt: string | null
  }>
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

// ─── Groups ──────────────────────────────────────────────────────────────────────

export function useCustomerGroups() {
  return useQuery<CustomerGroup[]>({ queryKey: ["v1", "customer-groups"], queryFn: () => get("/api/v1/customer-groups", "Failed to load groups") })
}
export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; discountPercent?: number }) => send<CustomerGroup>("/api/v1/customer-groups", "POST", data, "Failed to create group"),
    onSuccess: () => { toast.success("Group created"); qc.invalidateQueries({ queryKey: ["v1", "customer-groups"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<CustomerGroup, 'name' | 'discountPercent' | 'status'>>) =>
      send<CustomerGroup>(`/api/v1/customer-groups/${id}`, "PATCH", data, "Failed to update group"),
    onSuccess: () => { toast.success("Group updated"); qc.invalidateQueries({ queryKey: ["v1", "customer-groups"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Customers ─────────────────────────────────────────────────────────────────────

export function useCustomers(opts?: { status?: string; groupId?: string; search?: string }) {
  const qs = new URLSearchParams()
  if (opts?.status) qs.set("status", opts.status)
  if (opts?.groupId) qs.set("groupId", opts.groupId)
  if (opts?.search) qs.set("search", opts.search)
  const s = qs.toString()
  return useQuery<Customer[]>({
    queryKey: ["v1", "customers", opts ?? {}],
    queryFn: () => get(`/api/v1/customers${s ? `?${s}` : ""}`, "Failed to load customers"),
  })
}
export function useCustomer(id: string | null) {
  return useQuery<CustomerDetail>({
    enabled: !!id,
    queryKey: ["v1", "customers", "detail", id],
    queryFn: () => get(`/api/v1/customers/${id}`, "Failed to load customer"),
  })
}
export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; phone: string; email?: string; groupId?: string; type?: CustomerType; notes?: string }) =>
      send<Customer>("/api/v1/customers", "POST", data, "Failed to create customer"),
    onSuccess: () => { toast.success("Customer created"); qc.invalidateQueries({ queryKey: ["v1", "customers"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      send<Customer>(`/api/v1/customers/${id}`, "PATCH", data, "Failed to update customer"),
    onSuccess: (_d, v) => {
      toast.success("Customer updated")
      qc.invalidateQueries({ queryKey: ["v1", "customers"] })
      qc.invalidateQueries({ queryKey: ["v1", "customers", "detail", v.id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
/** action: block | unblock | archive */
export function useCustomerStatus(action: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send<Customer>(`/api/v1/customers/${id}/${action}`, "POST", null, `Failed to ${action}`),
    onSuccess: (_d, id) => {
      toast.success("Customer updated")
      qc.invalidateQueries({ queryKey: ["v1", "customers"] })
      qc.invalidateQueries({ queryKey: ["v1", "customers", "detail", id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Wallet ────────────────────────────────────────────────────────────────────────

export function useWallet(id: string | null) {
  return useQuery<{ balance: number; transactions: WalletTxn[] }>({
    enabled: !!id,
    queryKey: ["v1", "customers", "wallet", id],
    queryFn: () => get(`/api/v1/customers/${id}/wallet`, "Failed to load wallet"),
  })
}
/** action: credit | debit */
export function useWalletAction(action: 'credit' | 'debit') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, note, source }: { id: string; amount: number; note?: string; source?: string }) =>
      send<WalletTxn>(`/api/v1/customers/${id}/wallet/${action}`, "POST", { amount, note, source }, `Failed to ${action} wallet`),
    onSuccess: (_d, v) => {
      toast.success(`Wallet ${action === 'credit' ? 'credited' : 'debited'}`)
      qc.invalidateQueries({ queryKey: ["v1", "customers", "wallet", v.id] })
      qc.invalidateQueries({ queryKey: ["v1", "customers", "detail", v.id] })
      qc.invalidateQueries({ queryKey: ["v1", "customers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Loyalty ───────────────────────────────────────────────────────────────────────

export function useLoyalty(id: string | null) {
  return useQuery<{ points: number; transactions: LoyaltyTxn[] }>({
    enabled: !!id,
    queryKey: ["v1", "customers", "loyalty", id],
    queryFn: () => get(`/api/v1/customers/${id}/loyalty`, "Failed to load loyalty"),
  })
}
/** action: earn | redeem | reverse */
export function useLoyaltyAction(action: 'earn' | 'redeem' | 'reverse') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, points, note }: { id: string; points: number; note?: string }) =>
      send<LoyaltyTxn>(`/api/v1/customers/${id}/loyalty/${action}`, "POST", { points, note }, `Failed to ${action} points`),
    onSuccess: (_d, v) => {
      toast.success("Loyalty updated")
      qc.invalidateQueries({ queryKey: ["v1", "customers", "loyalty", v.id] })
      qc.invalidateQueries({ queryKey: ["v1", "customers", "detail", v.id] })
      qc.invalidateQueries({ queryKey: ["v1", "customers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── History + Reports ───────────────────────────────────────────────────────────────

export function useCustomerReports() {
  return useQuery<CustomerReports>({ queryKey: ["v1", "customers", "reports"], queryFn: () => get("/api/v1/customers/reports", "Failed to load reports") })
}
