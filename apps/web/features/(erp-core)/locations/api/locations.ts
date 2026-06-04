"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

type Location = { id: string; name: string; code: string; type: string; status: string; branchId: string | null }
type ApiOk<T> = { success: true; data: T }

export function useGetWarehouses() {
  return useQuery<Location[]>({
    queryKey: ["v1", "locations", "warehouses"],
    queryFn: async () => {
      const res = await client.api.v1.locations.warehouses.$get()
      if (!res.ok) throw new Error("Failed to fetch warehouses")
      return (await res.json() as ApiOk<Location[]>).data
    },
  })
}

export function useGetOutlets() {
  return useQuery<Location[]>({
    queryKey: ["v1", "locations", "outlets"],
    queryFn: async () => {
      const res = await client.api.v1.locations.outlets.$get()
      if (!res.ok) throw new Error("Failed to fetch outlets")
      return (await res.json() as ApiOk<Location[]>).data
    },
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; code: string; branchId?: string }) => {
      const res = await client.api.v1.locations.warehouses.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create warehouse")
      }
      return (await res.json() as ApiOk<Location>).data
    },
    onSuccess: () => { toast.success("Warehouse created"); qc.invalidateQueries({ queryKey: ["v1", "locations", "warehouses"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateOutlet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; code: string; branchId?: string }) => {
      const res = await client.api.v1.locations.outlets.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create outlet")
      }
      return (await res.json() as ApiOk<Location>).data
    },
    onSuccess: () => { toast.success("Outlet created"); qc.invalidateQueries({ queryKey: ["v1", "locations", "outlets"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
