"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

type Unit = { id: string; name: string; shortName: string; createdAt: string }
type ApiOk<T> = { success: true; data: T }

export function useGetUnits() {
  return useQuery<Unit[]>({
    queryKey: ["v1", "units"],
    queryFn: async () => {
      const res = await client.api.v1.units.$get()
      if (!res.ok) throw new Error("Failed to fetch units")
      return (await res.json() as ApiOk<Unit[]>).data
    },
  })
}

export function useCreateUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; shortName: string }) => {
      const res = await client.api.v1.units.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create unit")
      }
      return (await res.json() as ApiOk<Unit>).data
    },
    onSuccess: () => { toast.success("Unit created"); qc.invalidateQueries({ queryKey: ["v1", "units"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1.units[":id"].$delete({ param: { id } })
      if (!res.ok) throw new Error("Failed to delete unit")
    },
    onSuccess: () => { toast.success("Unit deleted"); qc.invalidateQueries({ queryKey: ["v1", "units"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
