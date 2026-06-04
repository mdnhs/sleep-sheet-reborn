"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type Supplier = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
}

export type SupplierPayment = {
  id: string
  supplierId: string
  amount: number
  paymentMethod: 'CASH' | 'BANK' | 'BKASH' | 'NAGAD' | 'CHEQUE'
  referenceNo: string | null
  notes: string | null
  createdAt: string
}

export function useListSuppliers(status?: Supplier['status']) {
  return useQuery<Supplier[]>({
    queryKey: ["v1", "suppliers", status ?? "all"],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (status) query.status = status
      const res = await client.api.v1.suppliers.$get({ query })
      if (!res.ok) throw new Error("Failed to fetch suppliers")
      return (await res.json() as ApiOk<Supplier[]>).data
    },
  })
}

export function useGetSupplier(id: string) {
  return useQuery<Supplier>({
    queryKey: ["v1", "suppliers", id],
    queryFn: async () => {
      const res = await client.api.v1.suppliers[":id"].$get({ param: { id } })
      if (!res.ok) throw new Error("Failed to fetch supplier")
      return (await res.json() as ApiOk<Supplier>).data
    },
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; phone: string; email?: string; address?: string; notes?: string }) => {
      const res = await client.api.v1.suppliers.$post({ json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create supplier")
      }
      return (await res.json() as ApiOk<Supplier>).data
    },
    onSuccess: () => {
      toast.success("Supplier created")
      qc.invalidateQueries({ queryKey: ["v1", "suppliers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; phone?: string; email?: string; address?: string; notes?: string }) => {
      const res = await client.api.v1.suppliers[":id"].$patch({ param: { id }, json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to update supplier")
      }
      return (await res.json() as ApiOk<Supplier>).data
    },
    onSuccess: () => {
      toast.success("Supplier updated")
      qc.invalidateQueries({ queryKey: ["v1", "suppliers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useArchiveSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.v1.suppliers[":id"].archive.$post({ param: { id } })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to archive supplier")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Supplier archived")
      qc.invalidateQueries({ queryKey: ["v1", "suppliers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGetSupplierPayments(supplierId: string) {
  return useQuery<SupplierPayment[]>({
    queryKey: ["v1", "suppliers", supplierId, "payments"],
    queryFn: async () => {
      const res = await client.api.v1.suppliers[":id"].payments.$get({ param: { id: supplierId } })
      if (!res.ok) throw new Error("Failed to fetch payments")
      return (await res.json() as ApiOk<SupplierPayment[]>).data
    },
    enabled: !!supplierId,
  })
}

export function useAddSupplierPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      supplierId,
      ...data
    }: {
      supplierId: string
      amount: number
      paymentMethod: 'CASH' | 'BANK' | 'BKASH' | 'NAGAD' | 'CHEQUE'
      referenceNo?: string
      notes?: string
    }) => {
      const res = await client.api.v1.suppliers[":id"].payments.$post({ param: { id: supplierId }, json: data })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to add payment")
      }
      return (await res.json() as ApiOk<SupplierPayment>).data
    },
    onSuccess: (_, vars) => {
      toast.success("Payment recorded")
      qc.invalidateQueries({ queryKey: ["v1", "suppliers", vars.supplierId, "payments"] })
      qc.invalidateQueries({ queryKey: ["v1", "purchase-orders", "due"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
