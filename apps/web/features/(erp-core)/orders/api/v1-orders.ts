"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED' | 'REFUNDED'

export type OrderItem = {
  id: string
  orderId: string
  variantId: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
  createdAt: string
}

export type OrderAddress = {
  id: string
  orderId: string
  name: string
  phone: string
  address: string
  area: string | null
  city: string
  createdAt: string
}

export type TimelineEntry = {
  id: string
  organizationId: string
  orderId: string
  event: string
  note: string | null
  actorId: string | null
  createdAt: string
}

export type Order = {
  id: string
  orderNumber: string
  customerId: string | null
  fulfillmentLocationId: string
  source: 'POS' | 'WEBSITE' | 'FUNNEL' | 'MANUAL' | 'API'
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'BANK' | 'WALLET' | null
  subtotal: number
  discount: number
  tax: number
  shippingCost: number
  grandTotal: number
  notes: string | null
  customerNotes: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
}

export type OrderDetail = Order & {
  items: OrderItem[]
  address: OrderAddress | null
  timeline: TimelineEntry[]
}

export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type OrderRefund = {
  id: string
  organizationId: string
  orderId: string
  amount: number
  reason: string | null
  status: RefundStatus
  method: 'ORIGINAL' | 'WALLET' | 'MANUAL'
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export type ReturnStatus = 'PENDING' | 'APPROVED' | 'CANCELLED'

export type OrderReturnItem = {
  id: string
  orderReturnId: string
  orderItemId: string
  variantId: string
  quantity: number
  createdAt: string
}

export type OrderReturn = {
  id: string
  organizationId: string
  orderId: string
  returnNumber: string
  status: ReturnStatus
  notes: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export type OrderReturnWithItems = OrderReturn & { items: OrderReturnItem[] }

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useListOrders(status?: OrderStatus) {
  return useQuery<Order[]>({
    queryKey: ["v1", "orders", status ?? "all"],
    queryFn: async () => {
      const query = status ? `?status=${status}` : ""
      const res = await fetch(`/api/v1/orders${query}`)
      if (!res.ok) throw new Error("Failed to fetch orders")
      return (await res.json() as ApiOk<Order[]>).data
    },
  })
}

export function useGetOrder(id: string) {
  return useQuery<OrderDetail>({
    queryKey: ["v1", "orders", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/orders/${id}`)
      if (!res.ok) throw new Error("Failed to fetch order")
      return (await res.json() as ApiOk<OrderDetail>).data
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      items: Array<{ variantId: string; quantity: number; unitPrice: number; discount?: number }>
      address: { name: string; phone: string; address: string; area?: string; city: string }
      locationId: string
      source?: 'POS' | 'WEBSITE' | 'FUNNEL' | 'MANUAL' | 'API'
      paymentMethod?: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'BANK' | 'WALLET'
      notes?: string
      customerNotes?: string
      customerId?: string
      discount?: number
      tax?: number
      shippingCost?: number
    }) => {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create order")
      }
      return (await res.json() as ApiOk<OrderDetail>).data
    },
    onSuccess: () => {
      toast.success("Order created")
      qc.invalidateQueries({ queryKey: ["v1", "orders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

function makeStatusMutation(endpoint: string, successMsg: string) {
  return function useStatusMutation() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (id: string) => {
        const res = await fetch(`/api/v1/orders/${id}/${endpoint}`, { method: 'POST' })
        if (!res.ok) {
          const e = await res.json() as { message?: string }
          throw new Error(e.message ?? `Failed to ${endpoint} order`)
        }
        return (await res.json() as ApiOk<OrderDetail>).data
      },
      onSuccess: (_, id) => {
        toast.success(successMsg)
        qc.invalidateQueries({ queryKey: ["v1", "orders"] })
        qc.invalidateQueries({ queryKey: ["v1", "orders", id] })
      },
      onError: (e: Error) => toast.error(e.message),
    })
  }
}

export const useConfirmOrder = makeStatusMutation('confirm', 'Order confirmed')
export const useProcessOrder = makeStatusMutation('process', 'Order processing')
export const usePackOrder = makeStatusMutation('pack', 'Order packed')
export const useShipOrder = makeStatusMutation('ship', 'Order shipped')
export const useDeliverOrder = makeStatusMutation('deliver', 'Order delivered — inventory updated')
export const useCancelOrder = makeStatusMutation('cancel', 'Order cancelled')

// ─── Order Refunds ────────────────────────────────────────────────────────────

export function useListOrderRefunds(orderId?: string) {
  return useQuery<OrderRefund[]>({
    queryKey: ["v1", "order-refunds", orderId ?? "all"],
    queryFn: async () => {
      const query = orderId ? `?orderId=${orderId}` : ""
      const res = await fetch(`/api/v1/order-refunds${query}`)
      if (!res.ok) throw new Error("Failed to fetch refunds")
      return (await res.json() as ApiOk<OrderRefund[]>).data
    },
  })
}

export function useCreateOrderRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { orderId: string; amount: number; reason?: string; method?: 'ORIGINAL' | 'WALLET' | 'MANUAL' }) => {
      const res = await fetch('/api/v1/order-refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create refund")
      }
      return (await res.json() as ApiOk<OrderRefund>).data
    },
    onSuccess: () => {
      toast.success("Refund request created")
      qc.invalidateQueries({ queryKey: ["v1", "order-refunds"] })
      qc.invalidateQueries({ queryKey: ["v1", "orders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApproveOrderRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/order-refunds/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to approve refund")
      }
      return (await res.json() as ApiOk<OrderRefund>).data
    },
    onSuccess: () => {
      toast.success("Refund approved")
      qc.invalidateQueries({ queryKey: ["v1", "order-refunds"] })
      qc.invalidateQueries({ queryKey: ["v1", "orders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Order Returns ────────────────────────────────────────────────────────────

export function useListOrderReturns(orderId?: string, status?: ReturnStatus) {
  return useQuery<OrderReturn[]>({
    queryKey: ["v1", "order-returns", orderId ?? "all", status ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (orderId) params.set('orderId', orderId)
      if (status) params.set('status', status)
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`/api/v1/order-returns${query}`)
      if (!res.ok) throw new Error("Failed to fetch returns")
      return (await res.json() as ApiOk<OrderReturn[]>).data
    },
  })
}

export function useCreateOrderReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      orderId: string
      items: Array<{ orderItemId: string; variantId: string; quantity: number }>
      notes?: string
    }) => {
      const res = await fetch('/api/v1/order-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to create return")
      }
      return (await res.json() as ApiOk<OrderReturnWithItems>).data
    },
    onSuccess: () => {
      toast.success("Return request created")
      qc.invalidateQueries({ queryKey: ["v1", "order-returns"] })
      qc.invalidateQueries({ queryKey: ["v1", "orders"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApproveOrderReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/order-returns/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const e = await res.json() as { message?: string }
        throw new Error(e.message ?? "Failed to approve return")
      }
      return (await res.json() as ApiOk<OrderReturn>).data
    },
    onSuccess: () => {
      toast.success("Return approved — inventory restored")
      qc.invalidateQueries({ queryKey: ["v1", "order-returns"] })
      qc.invalidateQueries({ queryKey: ["v1", "orders"] })
      qc.invalidateQueries({ queryKey: ["v1", "inventory"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
