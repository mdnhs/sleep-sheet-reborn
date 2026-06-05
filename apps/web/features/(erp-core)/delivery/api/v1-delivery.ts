"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type PartnerStatus = 'ACTIVE' | 'INACTIVE'
export type RiderStatus = 'AVAILABLE' | 'BUSY' | 'INACTIVE'
export type ShipmentStatus = 'CREATED' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED' | 'CANCELLED'

export type DeliveryPartner = {
  id: string; organizationId: string; name: string; code: string | null; phone: string | null
  status: PartnerStatus; createdAt: string; updatedAt: string
}
export type Rider = {
  id: string; organizationId: string; name: string; phone: string; status: RiderStatus
  createdAt: string; updatedAt: string
}
export type Shipment = {
  id: string; organizationId: string; orderId: string; trackingNumber: string
  deliveryPartnerId: string | null; riderId: string | null; originLocationId: string | null
  status: ShipmentStatus; courierStatus: string | null; codAmount: number
  createdAt: string; updatedAt: string
}
export type ShipmentEvent = {
  id: string; shipmentId: string; status: string; note: string | null; createdAt: string
}
export type DeliveryReports = {
  total: number; delivered: number; failed: number; returned: number; inProgress: number; successRate: number
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

// ─── Partners ─────────────────────────────────────────────────────────────────

export function useDeliveryPartners() {
  return useQuery<DeliveryPartner[]>({ queryKey: ["v1", "delivery-partners"], queryFn: () => get("/api/v1/delivery-partners", "Failed to load partners") })
}
export function useCreatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; code?: string; phone?: string }) => send<DeliveryPartner>("/api/v1/delivery-partners", "POST", data, "Failed to create partner"),
    onSuccess: () => { toast.success("Partner created"); qc.invalidateQueries({ queryKey: ["v1", "delivery-partners"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<DeliveryPartner, 'name' | 'code' | 'phone' | 'status'>>) =>
      send<DeliveryPartner>(`/api/v1/delivery-partners/${id}`, "PATCH", data, "Failed to update partner"),
    onSuccess: () => { toast.success("Partner updated"); qc.invalidateQueries({ queryKey: ["v1", "delivery-partners"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Riders ─────────────────────────────────────────────────────────────────

export function useRiders() {
  return useQuery<Rider[]>({ queryKey: ["v1", "riders"], queryFn: () => get("/api/v1/riders", "Failed to load riders") })
}
export function useCreateRider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; phone: string }) => send<Rider>("/api/v1/riders", "POST", data, "Failed to create rider"),
    onSuccess: () => { toast.success("Rider created"); qc.invalidateQueries({ queryKey: ["v1", "riders"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateRider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<Rider, 'name' | 'phone' | 'status'>>) =>
      send<Rider>(`/api/v1/riders/${id}`, "PATCH", data, "Failed to update rider"),
    onSuccess: () => { toast.success("Rider updated"); qc.invalidateQueries({ queryKey: ["v1", "riders"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Shipments ────────────────────────────────────────────────────────────────

export function useShipments(status?: ShipmentStatus) {
  return useQuery<Shipment[]>({
    queryKey: ["v1", "shipments", status ?? "all"],
    queryFn: () => get(`/api/v1/shipments${status ? `?status=${status}` : ""}`, "Failed to load shipments"),
  })
}
export function useShipment(id: string | null) {
  return useQuery<Shipment & { events: ShipmentEvent[] }>({
    enabled: !!id,
    queryKey: ["v1", "shipments", "detail", id],
    queryFn: () => get(`/api/v1/shipments/${id}`, "Failed to load shipment"),
  })
}
export function useDeliveryReports() {
  return useQuery<DeliveryReports>({ queryKey: ["v1", "shipments", "reports"], queryFn: () => get("/api/v1/shipments/reports", "Failed to load reports") })
}

export function useCreateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { orderId: string; deliveryPartnerId?: string; codAmount?: number }) =>
      send<Shipment>("/api/v1/shipments", "POST", data, "Failed to create shipment"),
    onSuccess: () => { toast.success("Shipment created"); qc.invalidateQueries({ queryKey: ["v1", "shipments"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Generic shipment action: assign-rider | assign-partner | pickup | transit | deliver | fail | return | cancel | courier-status */
export function useShipmentAction(action: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: unknown }) =>
      send<Shipment>(`/api/v1/shipments/${id}/${action}`, "POST", body ?? null, `Failed to ${action.replace(/-/g, ' ')}`),
    onSuccess: (_d, v) => {
      toast.success("Shipment updated")
      qc.invalidateQueries({ queryKey: ["v1", "shipments"] })
      qc.invalidateQueries({ queryKey: ["v1", "shipments", "detail", v.id] })
      qc.invalidateQueries({ queryKey: ["v1", "riders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
