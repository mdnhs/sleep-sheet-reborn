import type { Database } from '@repo/database'
import { createOrderRefundsRepository } from '../../repositories/order-refunds.repository'
import { createOrdersRepository } from '../../repositories/orders.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'
import { refundToWallet, reverseLoyalty, notifyOrg } from './integrations'

export function createOrderRefundsService(db: Database, organizationId: string) {
  const repo = createOrderRefundsRepository(db, organizationId)
  const ordersRepo = createOrdersRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  return {
    async list(orderId?: string) {
      return repo.findMany(orderId)
    },

    async get(id: string) {
      const refund = await repo.findById(id)
      if (!refund) throw new ServiceError('Refund not found', 404)
      return refund
    },

    async create(data: {
      orderId: string
      amount: number
      reason?: string
      method?: 'ORIGINAL' | 'WALLET' | 'MANUAL'
      actorId?: string
    }) {
      const o = await ordersRepo.findById(data.orderId)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status !== 'DELIVERED') throw new ServiceError('Refunds can only be requested for DELIVERED orders', 400)
      if (data.amount <= 0) throw new ServiceError('Refund amount must be positive', 400)
      if (data.amount > o.grandTotal) throw new ServiceError('Refund amount cannot exceed order total', 400)

      const refund = await repo.create({
        orderId: data.orderId,
        amount: data.amount,
        reason: data.reason ?? null,
        status: 'PENDING',
        method: data.method ?? 'MANUAL',
        approvedBy: null,
      })

      await ordersRepo.addTimeline({
        orderId: data.orderId,
        event: 'REFUND_REQUESTED',
        note: data.reason,
        actorId: data.actorId,
      })

      return refund
    },

    async approve(id: string, actorId: string) {
      const refund = await repo.findById(id)
      if (!refund) throw new ServiceError('Refund not found', 404)
      if (refund.status !== 'PENDING') throw new ServiceError('Only PENDING refunds can be approved', 400)

      const o = await ordersRepo.findById(refund.orderId)
      if (!o) throw new ServiceError('Order not found', 404)

      // Determine new payment status
      const newPaymentStatus = refund.amount >= o.grandTotal ? 'REFUNDED' : 'PARTIALLY_PAID'
      await ordersRepo.update(refund.orderId, { paymentStatus: newPaymentStatus })

      const updated = await repo.update(id, { status: 'APPROVED', approvedBy: actorId })

      await ordersRepo.addTimeline({
        orderId: refund.orderId,
        event: 'REFUND_APPROVED',
        note: `Approved refund of ${refund.amount}`,
        actorId,
      })

      await auditRepo.log('order_refund', id, 'approve', actorId, {
        amount: refund.amount,
        newPaymentStatus,
      })

      // Refund credited to wallet + earned loyalty reversed; staff notified.
      await refundToWallet(db, organizationId, o.customerId, refund.amount, { type: 'order_refund', id })
      await reverseLoyalty(db, organizationId, o.customerId, refund.amount, { type: 'order_refund', id })
      await notifyOrg(db, organizationId, { title: `Refund approved for order ${o.orderNumber}`, body: `Amount ${refund.amount}`, type: 'WARNING', entityType: 'order_refund', entityId: id })

      return updated
    },
  }
}
