"use client"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/rpc"

export type CategoryV1 = { id: string; name: string; slug: string; parentId: string | null; status: string }
type ApiOk<T> = { success: true; data: T }

export function useGetCategoriesV1() {
  return useQuery<CategoryV1[]>({
    queryKey: ["v1", "categories"],
    queryFn: async () => {
      const res = await client.api.v1.categories.$get()
      if (!res.ok) throw new Error("Failed to fetch categories")
      return (await res.json() as ApiOk<CategoryV1[]>).data
    },
  })
}
