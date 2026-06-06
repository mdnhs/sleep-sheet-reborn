"use client"
import { useQuery } from "@tanstack/react-query"

type ApiOk<T> = { success: true; data: T }
export type Range = { from?: string; to?: string }

export type SalesSummary = {
  totalRevenue: number; totalOrders: number; orderRevenue: number; orderCount: number
  posRevenue: number; posCount: number; averageOrderValue: number
}
export type TimePoint = { period: string; revenue: number; orders: number }
export type ChannelRow = { channel: string; revenue: number; orders: number }
export type TopProduct = { variantId: string; sku: string; name: string; units: number; revenue: number }
export type OutletRow = { locationId: string; locationName: string; revenue: number; orders: number }
export type Valuation = { totalUnits: number; costValue: number; retailValue: number; potentialMargin: number }
export type LowStockRow = { variantId: string; sku: string; name: string; locationName: string; quantity: number }
export type MovementRow = { movementType: string; count: number; netQuantity: number }
export type PurchaseSummary = {
  byStatus: { status: string; count: number; total: number }[]
  topSuppliers: { supplierId: string; supplierName: string; count: number; total: number }[]
  totalSpend: number
}

async function get<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(fallback)
  return (await res.json() as ApiOk<T>).data
}
const BASE = "/api/v1/reports"
function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v)
  const s = u.toString()
  return s ? `?${s}` : ""
}

export function useSalesSummary(r: Range = {}) {
  return useQuery<SalesSummary>({ queryKey: ["v1", "reports", "sales-summary", r], queryFn: () => get(`${BASE}/sales/summary${qs(r)}`, "Failed to load sales summary") })
}
export function useSalesTimeSeries(granularity: "day" | "month" | "year", r: Range = {}) {
  return useQuery<TimePoint[]>({ queryKey: ["v1", "reports", "sales-ts", granularity, r], queryFn: () => get(`${BASE}/sales/time-series${qs({ granularity, ...r })}`, "Failed to load time series") })
}
export function useSalesByChannel(r: Range = {}) {
  return useQuery<ChannelRow[]>({ queryKey: ["v1", "reports", "channel", r], queryFn: () => get(`${BASE}/sales/by-channel${qs(r)}`, "Failed to load channel report") })
}
export function useTopProducts(r: Range = {}) {
  return useQuery<TopProduct[]>({ queryKey: ["v1", "reports", "top-products", r], queryFn: () => get(`${BASE}/sales/top-products${qs(r)}`, "Failed to load top products") })
}
export function useOutletPerformance(r: Range = {}) {
  return useQuery<OutletRow[]>({ queryKey: ["v1", "reports", "outlets", r], queryFn: () => get(`${BASE}/sales/outlets${qs(r)}`, "Failed to load outlet report") })
}
export function useInventoryValuation() {
  return useQuery<Valuation>({ queryKey: ["v1", "reports", "valuation"], queryFn: () => get(`${BASE}/inventory/valuation`, "Failed to load valuation") })
}
export function useLowStock(threshold = 5) {
  return useQuery<LowStockRow[]>({ queryKey: ["v1", "reports", "low-stock", threshold], queryFn: () => get(`${BASE}/inventory/low-stock${qs({ threshold: String(threshold) })}`, "Failed to load low stock") })
}
export function useMovementSummary(r: Range = {}) {
  return useQuery<MovementRow[]>({ queryKey: ["v1", "reports", "movements", r], queryFn: () => get(`${BASE}/inventory/movements${qs(r)}`, "Failed to load movements") })
}
export function usePurchaseSummary(r: Range = {}) {
  return useQuery<PurchaseSummary>({ queryKey: ["v1", "reports", "purchases", r], queryFn: () => get(`${BASE}/purchases/summary${qs(r)}`, "Failed to load purchase report") })
}
