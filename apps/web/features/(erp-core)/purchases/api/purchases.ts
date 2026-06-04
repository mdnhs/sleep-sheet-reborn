"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type POStatus = 'DRAFT' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED'

export type PurchaseItem = {
  id: string
  purchaseOrderId: string
  variantId: string
  quantity: number
  receivedQuantity: number
  unitCost: number
  createdAt: string
}

export type PurchaseOrder = {
  id: string
  supplierId: string
  purchaseNumber: string
  status: POStatus
  receivingLocationId: string
  subtotal: number
  tax: number
  discount: number
  grandTotal: number
  notes: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseOrderWithItems = PurchaseOrder & { items: PurchaseItem[] }

export type SupplierDue = {
  supplierId: string
  supplierName: string
  totalPurchased: number
  totalPaid: number
  due: number
}

export function useListPurchaseOrders(status?: POStatus) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ["v1", "purchase-orders", status ?? "all"],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (status) query.status = status
      const res = await client.api.v1["purchase-orders"].$get({ query })
      if (!res.ok) throw new Error("Failed to fetch purchase orders")
      return (await res.json() as ApiOk<PurchaseOrder[]>).data
    },
  })
}

export function useGetPurchaseOrder(id: string) {
  return useQuery<PurchaseOrderWithItems>({
    queryKey: ["v1", "purchase-orders", id],
    queryFn: async () => {
      const res = await client.api.v1["purchase-orders"][":id"].$get({ param: { id } })
      if (!res.ok) throw new Error("Failed to fetch purchase order")
      return (await res.json() as ApiOk<PurchaseOrderWithItems>).data
    },
    enabled: !!id,
  })
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      supplierId: string
      receivingLocationId: string
      items: Array<{ variantId: string; quantity: number; unitCost: number }>
      tax?: number
      discount?: number
      notes?: string
    }) => {
      const res = await client.api.v1["purchase-orders"].$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create purchase order")
      }
      return (await res.json() as ApiOk<PurchaseOrderWithItems>).data
    },
    onSuccess: () => {
      toast.success("Purchase order created")
      qc.invalidateQueries({ queryKey: ["v1", "purchase-orders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApprovePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1["purchase-orders"][":id"].approve.$post({ param: { id } })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to approve purchase order")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Purchase order approved")
      qc.invalidateQueries({ queryKey: ["v1", "purchase-orders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, items }: { id: string; items: Array<{ itemId: string; receivedQty: number }> }) => {
      const res = await client.api.v1["purchase-orders"][":id"].receive.$post({ param: { id }, json: { items } })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to receive goods")
      }
      return (await res.json() as ApiOk<PurchaseOrderWithItems>).data
    },
    onSuccess: () => {
      toast.success("Goods received — inventory updated")
      qc.invalidateQueries({ queryKey: ["v1", "purchase-orders"] })
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1["purchase-orders"][":id"].cancel.$post({ param: { id } })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to cancel purchase order")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Purchase order cancelled")
      qc.invalidateQueries({ queryKey: ["v1", "purchase-orders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGetSupplierDue(supplierId: string) {
  return useQuery<SupplierDue>({
    queryKey: ["v1", "purchase-orders", "due", supplierId],
    queryFn: async () => {
      const res = await client.api.v1["purchase-orders"][":id"].due.$get({ param: { id: supplierId } })
      if (!res.ok) throw new Error("Failed to fetch supplier due")
      return (await res.json() as ApiOk<SupplierDue>).data
    },
    enabled: !!supplierId,
  })
}

// ─── Purchase Returns ─────────────────────────────────────────────────────────

export type PRStatus = 'PENDING' | 'APPROVED' | 'CANCELLED'

export type PurchaseReturnItem = {
  id: string
  purchaseReturnId: string
  purchaseItemId: string
  variantId: string
  quantity: number
  unitCost: number
  createdAt: string
}

export type PurchaseReturn = {
  id: string
  purchaseOrderId: string
  returnNumber: string
  status: PRStatus
  locationId: string
  notes: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseReturnWithItems = PurchaseReturn & { items: PurchaseReturnItem[] }

export function useListPurchaseReturns(purchaseOrderId?: string, status?: PRStatus) {
  return useQuery<PurchaseReturn[]>({
    queryKey: ["v1", "purchase-returns", purchaseOrderId ?? "all", status ?? "all"],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (purchaseOrderId) query.purchaseOrderId = purchaseOrderId
      if (status) query.status = status
      const res = await fetch(`/api/v1/purchase-returns?${new URLSearchParams(query)}`)
      if (!res.ok) throw new Error("Failed to fetch purchase returns")
      return (await res.json() as ApiOk<PurchaseReturn[]>).data
    },
  })
}

export function useGetPurchaseReturn(id: string) {
  return useQuery<PurchaseReturnWithItems>({
    queryKey: ["v1", "purchase-returns", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/purchase-returns/${id}`)
      if (!res.ok) throw new Error("Failed to fetch purchase return")
      return (await res.json() as ApiOk<PurchaseReturnWithItems>).data
    },
    enabled: !!id,
  })
}

export function useCreatePurchaseReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      purchaseOrderId: string
      items: Array<{ purchaseItemId: string; variantId: string; quantity: number }>
      notes?: string
    }) => {
      const res = await fetch('/api/v1/purchase-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create purchase return")
      }
      return (await res.json() as ApiOk<PurchaseReturnWithItems>).data
    },
    onSuccess: () => {
      toast.success("Purchase return created")
      qc.invalidateQueries({ queryKey: ["v1", "purchase-returns"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApprovePurchaseReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/purchase-returns/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to approve purchase return")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Return approved — inventory updated")
      qc.invalidateQueries({ queryKey: ["v1", "purchase-returns"] })
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCancelPurchaseReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/purchase-returns/${id}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to cancel purchase return")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Purchase return cancelled")
      qc.invalidateQueries({ queryKey: ["v1", "purchase-returns"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
