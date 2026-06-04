"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

type Brand = { id: string; name: string; slug: string; status: string; createdAt: string }
type ApiOk<T> = { success: true; data: T }

export function useGetBrands() {
  return useQuery<Brand[]>({
    queryKey: ["v1", "brands"],
    queryFn: async () => {
      const res = await client.api.v1.brands.$get()
      if (!res.ok) throw new Error("Failed to fetch brands")
      const body = await res.json() as ApiOk<Brand[]>
      return body.data
    },
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await client.api.v1.brands.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create brand")
      }
      return (await res.json() as ApiOk<Brand>).data
    },
    onSuccess: () => { toast.success("Brand created"); qc.invalidateQueries({ queryKey: ["v1", "brands"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; slug?: string }) => {
      const res = await client.api.v1.brands[":id"].$patch({ param: { id }, json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to update brand")
      }
      return (await res.json() as ApiOk<Brand>).data
    },
    onSuccess: () => { toast.success("Brand updated"); qc.invalidateQueries({ queryKey: ["v1", "brands"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useArchiveBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1.brands[":id"].$delete({ param: { id } })
      if (!res.ok) throw new Error("Failed to archive brand")
    },
    onSuccess: () => { toast.success("Brand archived"); qc.invalidateQueries({ queryKey: ["v1", "brands"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
