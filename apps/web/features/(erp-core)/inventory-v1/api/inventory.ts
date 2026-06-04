"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }
type StockRow = { variantId: string; locationId: string; quantity: number }
type Movement = { id: string; variantId: string; locationId: string; movementType: string; quantity: number; notes: string | null; createdAt: string }
export type TransferStatus = 'DRAFT' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED'
export type Transfer = {
  id: string
  fromLocationId: string
  toLocationId: string
  status: TransferStatus
  approvedBy: string | null
  receivedBy: string | null
  createdAt: string
  updatedAt: string
}
export type TransferWithItems = Transfer & {
  items: Array<{ id: string; variantId: string; quantity: number }>
}

export function useGetStockByLocation(locationId: string) {
  return useQuery<StockRow[]>({
    queryKey: ["v1", "inventory", "stock", "location", locationId],
    queryFn: async () => {
      const res = await client.api.v1.inventory.stock.location[":locationId"].$get({ param: { locationId } })
      if (!res.ok) throw new Error("Failed to fetch stock")
      return (await res.json() as ApiOk<StockRow[]>).data
    },
    enabled: !!locationId,
  })
}

export function useGetStockByVariant(variantId: string) {
  return useQuery<StockRow[]>({
    queryKey: ["v1", "inventory", "stock", "variant", variantId],
    queryFn: async () => {
      const res = await client.api.v1.inventory.stock.variant[":variantId"].$get({ param: { variantId } })
      if (!res.ok) throw new Error("Failed to fetch stock")
      return (await res.json() as ApiOk<StockRow[]>).data
    },
    enabled: !!variantId,
  })
}

export function useGetMovements(variantId?: string, locationId?: string) {
  return useQuery<Movement[]>({
    queryKey: ["v1", "inventory", "movements", variantId, locationId],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (variantId) query.variantId = variantId
      if (locationId) query.locationId = locationId
      const res = await client.api.v1.inventory.movements.$get({ query })
      if (!res.ok) throw new Error("Failed to fetch movements")
      return (await res.json() as ApiOk<Movement[]>).data
    },
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { variantId: string; locationId: string; quantity: number; notes?: string }) => {
      const res = await client.api.v1.inventory.adjustments.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Adjustment failed")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Stock adjusted")
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Transfers ─────────────────────────────────────────────────────────────────

export function useListTransfers(status?: TransferStatus) {
  return useQuery<Transfer[]>({
    queryKey: ["v1", "inventory", "transfers", status ?? "all"],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (status) query.status = status
      const res = await client.api.v1.inventory.transfers.$get({ query })
      if (!res.ok) throw new Error("Failed to fetch transfers")
      return (await res.json() as ApiOk<Transfer[]>).data
    },
  })
}

export function useGetTransfer(id: string) {
  return useQuery<TransferWithItems>({
    queryKey: ["v1", "inventory", "transfers", id],
    queryFn: async () => {
      const res = await client.api.v1.inventory.transfers[":id"].$get({ param: { id } })
      if (!res.ok) throw new Error("Failed to fetch transfer")
      return (await res.json() as ApiOk<TransferWithItems>).data
    },
    enabled: !!id,
  })
}

export function useCreateTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { fromLocationId: string; toLocationId: string; items: Array<{ variantId: string; quantity: number }> }) => {
      const res = await client.api.v1.inventory.transfers.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create transfer")
      }
      return (await res.json() as ApiOk<TransferWithItems>).data
    },
    onSuccess: () => {
      toast.success("Transfer created")
      qc.invalidateQueries({ queryKey: ["v1", "inventory", "transfers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApproveTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1.inventory.transfers[":id"].approve.$post({ param: { id } })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to approve transfer")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Transfer approved")
      qc.invalidateQueries({ queryKey: ["v1", "inventory", "transfers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useReceiveTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1.inventory.transfers[":id"].receive.$post({ param: { id } })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to receive transfer")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Transfer received — stock updated")
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCancelTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1.inventory.transfers[":id"].cancel.$post({ param: { id } })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to cancel transfer")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Transfer cancelled")
      qc.invalidateQueries({ queryKey: ["v1", "inventory", "transfers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
