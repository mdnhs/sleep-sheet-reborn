"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }
type StockRow = { variantId: string; locationId: string; quantity: number }
type Movement = { id: string; variantId: string; locationId: string; movementType: string; quantity: number; notes: string | null; createdAt: string }

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
