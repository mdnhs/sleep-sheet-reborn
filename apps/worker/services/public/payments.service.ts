import { eq, and } from 'drizzle-orm'
import { orderPayment, order } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { createOrdersRepository } from '../../repositories/orders.repository'
import { isValidProvider } from '../v1/billing-providers'
import { ServiceError } from '../../utils/service-error'
import { generateId } from '../../utils/id'

export type OrderWebhookPayload = {
  paymentId: string
  providerRef: string
  status: 'success' | 'failed'
  idempotencyKey: string
  signature?: string
}

function verifyOrderWebhook(p: Partial<OrderWebhookPayload>, secret?: string): p is OrderWebhookPayload {
  if (!p || typeof p.paymentId !== 'string' || typeof p.providerRef !== 'string') return false
  if (typeof p.idempotencyKey !== 'string' || !p.idempotencyKey) return false
  if (p.status !== 'success' && p.status !== 'failed') return false
  if (secret) return p.signature === `${p.paymentId}:${p.providerRef}:${p.status}:${secret}`
  return true
}

/** Tenant-scoped: start an online payment for one of the org's orders. */
export function createOrderPaymentService(db: Database, organizationId: string) {
  const orders = createOrdersRepository(db, organizationId)

  return {
    async initiate(orderId: string, provider: string) {
      if (!isValidProvider(provider) || provider === 'MANUAL') throw new ServiceError('Invalid payment provider', 400)
      const o = await orders.findById(orderId)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.paymentStatus === 'PAID') throw new ServiceError('Order already paid', 400)

      const now = new Date()
      const row = {
        id: generateId(), organizationId, orderId, provider: provider as any, amount: o.grandTotal,
        status: 'PENDING' as const, providerRef: null, idempotencyKey: null, createdAt: now, updatedAt: now,
      }
      await db.insert(orderPayment).values(row)
      // Real providers return a hosted redirect after server-to-server init; deferred.
      return { paymentId: row.id, amount: row.amount, provider, checkoutUrl: `/pay/${row.id}` }
    },
  }
}

/**
 * UNSCOPED inbound provider webhook for order payments. Verified + idempotent:
 * a duplicate event (same idempotencyKey) is a no-op. Org resolved from the payment.
 */
export async function handleOrderPaymentWebhook(db: Database, provider: string, body: unknown, secret?: string) {
  if (!isValidProvider(provider)) throw new ServiceError('Unknown provider', 404)
  const payload = body as Partial<OrderWebhookPayload>
  if (!verifyOrderWebhook(payload, secret)) throw new ServiceError('Invalid webhook signature', 401)

  // Idempotency: if this event was already recorded, do nothing.
  const dup = await db.select().from(orderPayment).where(eq(orderPayment.idempotencyKey, payload.idempotencyKey)).then(r => r[0])
  if (dup) return { ok: true, duplicate: true }

  const payment = await db.select().from(orderPayment).where(eq(orderPayment.id, payload.paymentId)).then(r => r[0])
  if (!payment) throw new ServiceError('Payment not found', 404)
  if (payment.status !== 'PENDING') return { ok: true, alreadyResolved: true }

  const now = new Date()
  const paid = payload.status === 'success'
  await db.update(orderPayment)
    .set({ status: paid ? 'PAID' : 'FAILED', providerRef: payload.providerRef, idempotencyKey: payload.idempotencyKey, updatedAt: now })
    .where(eq(orderPayment.id, payment.id))
  await db.update(order)
    .set({ paymentStatus: paid ? 'PAID' : 'FAILED', updatedAt: now })
    .where(and(eq(order.organizationId, payment.organizationId), eq(order.id, payment.orderId)))

  return { ok: true, status: paid ? 'PAID' : 'FAILED', orderId: payment.orderId }
}
