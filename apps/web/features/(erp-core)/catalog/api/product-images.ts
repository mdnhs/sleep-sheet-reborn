"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL ?? window.location.origin)
  : (process.env.API_URL ?? "")

export type ProductImage = {
  id: string
  productId: string
  cloudinaryPublicId: string
  url: string
  sortOrder: number
  createdAt: string
}

type ApiOk<T> = { success: true; data: T }

export function useGetProductImages(productId: string) {
  return useQuery<ProductImage[]>({
    queryKey: ["v1", "products", productId, "images"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/products/${productId}/images`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch images")
      return (await res.json() as ApiOk<ProductImage[]>).data
    },
    enabled: !!productId,
  })
}

export function useUploadProductImage(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`${API_BASE}/api/v1/products/${productId}/images`, {
        method: "POST",
        body: form,
        credentials: "include",
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Upload failed")
      }
      return (await res.json() as ApiOk<ProductImage>).data
    },
    onSuccess: () => {
      toast.success("Image uploaded")
      qc.invalidateQueries({ queryKey: ["v1", "products", productId, "images"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProductImage(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (imageId: string) => {
      const res = await fetch(`${API_BASE}/api/v1/products/${productId}/images/${imageId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to delete image")
    },
    onSuccess: () => {
      toast.success("Image deleted")
      qc.invalidateQueries({ queryKey: ["v1", "products", productId, "images"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
