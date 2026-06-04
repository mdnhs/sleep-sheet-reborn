"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

export type ProductV1 = {
  product: {
    id: string; name: string; slug: string; description: string | null
    status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED"
    categoryId: string | null; brandId: string | null
    organizationId: string; createdAt: string; updatedAt: string
  }
  category: { id: string; name: string; slug: string } | null
  brand: { id: string; name: string; slug: string } | null
}

export type Variant = {
  id: string; productId: string; name: string; sku: string
  barcode: string | null; costPrice: number; sellingPrice: number
  status: string; unitId: string | null
}

type Paginated<T> = { success: true; data: T[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }
type ApiOk<T> = { success: true; data: T }

export function useGetProductsV1(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ["v1", "products", params],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (params?.page) query.page = String(params.page)
      if (params?.limit) query.limit = String(params.limit)
      if (params?.search) query.search = params.search
      if (params?.status) query.status = params.status
      const res = await client.api.v1.products.$get({ query })
      if (!res.ok) throw new Error("Failed to fetch products")
      return res.json() as Promise<Paginated<ProductV1>>
    },
  })
}

export function useGetProductV1(id: string) {
  return useQuery({
    queryKey: ["v1", "products", id],
    queryFn: async () => {
      const res = await client.api.v1.products[":id"].$get({ param: { id } })
      if (!res.ok) throw new Error("Product not found")
      return (await res.json() as ApiOk<ProductV1 & { variants: Variant[]; images: unknown[] }>).data
    },
    enabled: !!id,
  })
}

export function useCreateProductV1() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string; categoryId?: string; brandId?: string }) => {
      const res = await client.api.v1.products.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create product")
      }
      return (await res.json() as ApiOk<ProductV1["product"]>).data
    },
    onSuccess: () => { toast.success("Product created"); qc.invalidateQueries({ queryKey: ["v1", "products"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProductV1() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string; name?: string; slug?: string; description?: string | null
      categoryId?: string | null; brandId?: string | null
      status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED"
    }) => {
      const res = await client.api.v1.products[":id"].$patch({ param: { id }, json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to update product")
      }
      return res.json()
    },
    onSuccess: () => { toast.success("Product updated"); qc.invalidateQueries({ queryKey: ["v1", "products"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useArchiveProductV1() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1.products[":id"].$delete({ param: { id } })
      if (!res.ok) throw new Error("Failed to archive product")
    },
    onSuccess: () => { toast.success("Product archived"); qc.invalidateQueries({ queryKey: ["v1", "products"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGetVariants(productId: string) {
  return useQuery({
    queryKey: ["v1", "products", productId, "variants"],
    queryFn: async () => {
      const res = await client.api.v1.products[":id"].variants.$get({ param: { id: productId } })
      if (!res.ok) throw new Error("Failed to fetch variants")
      return (await res.json() as ApiOk<Variant[]>).data
    },
    enabled: !!productId,
  })
}

export function useCreateVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, ...data }: {
      productId: string; name: string; sku: string
      barcode?: string; costPrice?: number; sellingPrice?: number; unitId?: string
    }) => {
      const res = await client.api.v1.products[":id"].variants.$post({ param: { id: productId }, json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create variant")
      }
      return (await res.json() as ApiOk<Variant>).data
    },
    onSuccess: (_, { productId }) => {
      toast.success("Variant created")
      qc.invalidateQueries({ queryKey: ["v1", "products", productId, "variants"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
