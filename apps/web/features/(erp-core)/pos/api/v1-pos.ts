"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterStatus = 'ACTIVE' | 'INACTIVE'
export type SessionStatus = 'OPEN' | 'CLOSED'
export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'RETURNED' | 'CANCELLED'
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'BANK' | 'WALLET'

export type CashRegister = {
  id: string
  organizationId: string
  locationId: string
  name: string
  status: RegisterStatus
  createdAt: string
  updatedAt: string
}

export type RegisterSession = {
  id: string
  organizationId: string
  cashRegisterId: string
  openedBy: string
  closedBy: string | null
  openingCash: number
  closingCash: number | null
  status: SessionStatus
  openedAt: string
  closedAt: string | null
}

export type RegisterSessionDetail = RegisterSession & {
  totalSales: number
  saleCount: number
}

export type PosSaleItem = {
  id: string
  saleId: string
  variantId: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
  createdAt: string
}

export type PosSalePayment = {
  id: string
  organizationId: string
  saleId: string
  method: PaymentMethod
  amount: number
  createdAt: string
}

export type PosSale = {
  id: string
  organizationId: string
  sessionId: string
  locationId: string
  customerId: string | null
  saleNumber: string
  status: SaleStatus
  subtotal: number
  discount: number
  tax: number
  grandTotal: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type PosSaleDetail = PosSale & {
  items: PosSaleItem[]
  payments: PosSalePayment[]
}

export type PosSaleReturnItem = {
  id: string
  returnId: string
  saleItemId: string
  variantId: string
  quantity: number
  createdAt: string
}

export type PosSaleReturn = {
  id: string
  organizationId: string
  saleId: string
  returnNumber: string
  status: ReturnStatus
  notes: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export type PosSaleReturnDetail = PosSaleReturn & {
  items: PosSaleReturnItem[]
}

// ─── Cash Registers ───────────────────────────────────────────────────────────

export function useListRegisters() {
  return useQuery<CashRegister[]>({
    queryKey: ["v1", "cash-registers"],
    queryFn: async () => {
      const res = await fetch("/api/v1/cash-registers")
      if (!res.ok) throw new Error("Failed to fetch registers")
      return (await res.json() as ApiOk<CashRegister[]>).data
    },
  })
}

export function useCreateRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { locationId: string; name: string }) => {
      const res = await fetch("/api/v1/cash-registers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create register")
      }
      return (await res.json() as ApiOk<CashRegister>).data
    },
    onSuccess: () => {
      toast.success("Register created")
      qc.invalidateQueries({ queryKey: ["v1", "cash-registers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; status?: RegisterStatus }) => {
      const res = await fetch(`/api/v1/cash-registers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to update register")
      }
      return (await res.json() as ApiOk<CashRegister>).data
    },
    onSuccess: () => {
      toast.success("Register updated")
      qc.invalidateQueries({ queryKey: ["v1", "cash-registers"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Register Sessions ────────────────────────────────────────────────────────

export function useListSessions(registerId?: string) {
  return useQuery<RegisterSession[]>({
    queryKey: ["v1", "register-sessions", registerId ?? "all"],
    queryFn: async () => {
      const query = registerId ? `?registerId=${registerId}` : ""
      const res = await fetch(`/api/v1/register-sessions${query}`)
      if (!res.ok) throw new Error("Failed to fetch sessions")
      return (await res.json() as ApiOk<RegisterSession[]>).data
    },
  })
}

export function useGetSession(id: string) {
  return useQuery<RegisterSessionDetail>({
    queryKey: ["v1", "register-sessions", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/register-sessions/${id}`)
      if (!res.ok) throw new Error("Failed to fetch session")
      return (await res.json() as ApiOk<RegisterSessionDetail>).data
    },
    enabled: !!id,
  })
}

export function useOpenSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ registerId, openingCash }: { registerId: string; openingCash: number }) => {
      const res = await fetch(`/api/v1/register-sessions/${registerId}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingCash }),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to open session")
      }
      return (await res.json() as ApiOk<RegisterSession>).data
    },
    onSuccess: () => {
      toast.success("Register session opened")
      qc.invalidateQueries({ queryKey: ["v1", "register-sessions"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCloseSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, closingCash }: { sessionId: string; closingCash: number }) => {
      const res = await fetch(`/api/v1/register-sessions/${sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingCash }),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to close session")
      }
      return (await res.json() as ApiOk<RegisterSessionDetail>).data
    },
    onSuccess: () => {
      toast.success("Register session closed")
      qc.invalidateQueries({ queryKey: ["v1", "register-sessions"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── POS Sales ────────────────────────────────────────────────────────────────

export function useListPosSales(status?: SaleStatus, sessionId?: string) {
  return useQuery<PosSale[]>({
    queryKey: ["v1", "pos-sales", status ?? "all", sessionId ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      if (sessionId) params.set("sessionId", sessionId)
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`/api/v1/pos-sales${query}`)
      if (!res.ok) throw new Error("Failed to fetch POS sales")
      return (await res.json() as ApiOk<PosSale[]>).data
    },
  })
}

export function useGetPosSale(id: string) {
  return useQuery<PosSaleDetail>({
    queryKey: ["v1", "pos-sales", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/pos-sales/${id}`)
      if (!res.ok) throw new Error("Failed to fetch POS sale")
      return (await res.json() as ApiOk<PosSaleDetail>).data
    },
    enabled: !!id,
  })
}

export function useCreatePosSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      sessionId: string
      items: Array<{ variantId: string; quantity: number; unitPrice: number; discount?: number }>
      payments: Array<{ method: PaymentMethod; amount: number }>
      discount?: number
      tax?: number
      notes?: string
      customerId?: string
    }) => {
      const res = await fetch("/api/v1/pos-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create sale")
      }
      return (await res.json() as ApiOk<PosSaleDetail>).data
    },
    onSuccess: () => {
      toast.success("Sale completed")
      qc.invalidateQueries({ queryKey: ["v1", "pos-sales"] })
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useHoldPosSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      sessionId: string
      items: Array<{ variantId: string; quantity: number; unitPrice: number; discount?: number }>
      discount?: number
      tax?: number
      notes?: string
      customerId?: string
    }) => {
      const res = await fetch("/api/v1/pos-sales/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to hold sale")
      }
      return (await res.json() as ApiOk<PosSaleDetail>).data
    },
    onSuccess: () => {
      toast.success("Sale held")
      qc.invalidateQueries({ queryKey: ["v1", "pos-sales"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCompletePosSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payments }: { id: string; payments: Array<{ method: PaymentMethod; amount: number }> }) => {
      const res = await fetch(`/api/v1/pos-sales/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments }),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to complete sale")
      }
      return (await res.json() as ApiOk<PosSaleDetail>).data
    },
    onSuccess: (_, { id }) => {
      toast.success("Sale completed — inventory deducted")
      qc.invalidateQueries({ queryKey: ["v1", "pos-sales"] })
      qc.invalidateQueries({ queryKey: ["v1", "pos-sales", id] })
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCancelPosSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/pos-sales/${id}/cancel`, { method: "POST" })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to cancel sale")
      }
      return (await res.json() as ApiOk<PosSaleDetail>).data
    },
    onSuccess: (_, id) => {
      toast.success("Sale cancelled")
      qc.invalidateQueries({ queryKey: ["v1", "pos-sales"] })
      qc.invalidateQueries({ queryKey: ["v1", "pos-sales", id] })
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── POS Returns ──────────────────────────────────────────────────────────────

export function useListPosReturns(saleId?: string, status?: ReturnStatus) {
  return useQuery<PosSaleReturn[]>({
    queryKey: ["v1", "pos-sale-returns", saleId ?? "all", status ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (saleId) params.set("saleId", saleId)
      if (status) params.set("status", status)
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`/api/v1/pos-sale-returns${query}`)
      if (!res.ok) throw new Error("Failed to fetch POS returns")
      return (await res.json() as ApiOk<PosSaleReturn[]>).data
    },
  })
}

export function useGetPosReturn(id: string) {
  return useQuery<PosSaleReturnDetail>({
    queryKey: ["v1", "pos-sale-returns", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/pos-sale-returns/${id}`)
      if (!res.ok) throw new Error("Failed to fetch POS return")
      return (await res.json() as ApiOk<PosSaleReturnDetail>).data
    },
    enabled: !!id,
  })
}

export function useCreatePosReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      saleId: string
      items: Array<{ saleItemId: string; variantId: string; quantity: number }>
      notes?: string
    }) => {
      const res = await fetch("/api/v1/pos-sale-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create return")
      }
      return (await res.json() as ApiOk<PosSaleReturnDetail>).data
    },
    onSuccess: () => {
      toast.success("Return request created")
      qc.invalidateQueries({ queryKey: ["v1", "pos-sale-returns"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApprovePosReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/pos-sale-returns/${id}/approve`, { method: "POST" })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to approve return")
      }
      return (await res.json() as ApiOk<PosSaleReturnDetail>).data
    },
    onSuccess: () => {
      toast.success("Return approved — inventory restored")
      qc.invalidateQueries({ queryKey: ["v1", "pos-sale-returns"] })
      qc.invalidateQueries({ queryKey: ["v1", "pos-sales"] })
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCancelPosReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/pos-sale-returns/${id}/cancel`, { method: "POST" })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to cancel return")
      }
      return (await res.json() as ApiOk<PosSaleReturnDetail>).data
    },
    onSuccess: () => {
      toast.success("Return cancelled")
      qc.invalidateQueries({ queryKey: ["v1", "pos-sale-returns"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
