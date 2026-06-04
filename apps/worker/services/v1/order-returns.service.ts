import type { Database } from '@repo/database'
import { createOrderReturnsRepository } from '../../repositories/order-returns.repository'
import { createOrdersRepository } from '../../repositories/orders.repository'
import { createInventoryRepository } from '../../repositories/inventory.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

export function createOrderReturnsService(db: Database, organizationId: string) {
  const repo = createOrderReturnsRepository(db, organizationId)
  const ordersRepo = createOrdersRepository(db, organizationId)
  const inventoryRepo = createInventoryRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function nextReturnNumber(): Promise<string> {
    const count = await repo.countByOrg()
    return `RET-${String(count + 1).padStart(5, '0')}`
  }

  return {
    async list(orderId?: string, status?: string) {
      return repo.findMany(orderId, status as any)
    },

    async get(id: string) {
      const ret = await repo.findById(id)
      if (!ret) throw new ServiceError('Order return not found', 404)
      const items = await repo.findItems(id)
      return { ...ret, items }
    },

    async create(data: {
      orderId: string
      items: Array<{ orderItemId: string; variantId: string; quantity: number }>
      notes?: string
      actorId?: string
    }) {
      const o = await ordersRepo.findById(data.orderId)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status !== 'DELIVERED') throw new ServiceError('Returns can only be requested for DELIVERED orders', 400)
      if (!data.items.length) throw new ServiceError('Return must have at least one item', 400)

      const orderItems = await ordersRepo.findItems(data.orderId)
      const orderItemMap = new Map(orderItems.map(i => [i.id, i]))

      for (const item of data.items) {
        if (item.quantity <= 0) throw new ServiceError('Return quantity must be positive', 400)

        const orderItem = orderItemMap.get(item.orderItemId)
        if (!orderItem) throw new ServiceError(`Order item ${item.orderItemId} not found in this order`, 404)
        if (orderItem.variantId !== item.variantId) {
          throw new ServiceError(`Variant mismatch for order item ${item.orderItemId}`, 400)
        }

        const alreadyReturned = await repo.getTotalReturnedQty(item.orderItemId)
        const returnable = orderItem.quantity - alreadyReturned
        if (item.quantity > returnable) {
          throw new ServiceError(
            `Cannot return ${item.quantity} of item ${item.orderItemId}: only ${returnable} returnable (ordered=${orderItem.quantity}, already returned=${alreadyReturned})`,
            400,
          )
        }
      }

      const returnNumber = await nextReturnNumber()

      const ret = await repo.create({
        orderId: data.orderId,
        returnNumber,
        status: 'PENDING',
        notes: data.notes ?? null,
        approvedBy: null,
      })

      for (const item of data.items) {
        await repo.addItem({
          orderReturnId: ret.id,
          orderItemId: item.orderItemId,
          variantId: item.variantId,
          quantity: item.quantity,
        })
      }

      await ordersRepo.addTimeline({
        orderId: data.orderId,
        event: 'RETURN_REQUESTED',
        note: data.notes,
        actorId: data.actorId,
      })

      await auditRepo.log('order_return', ret.id, 'create', data.actorId, {
        orderId: data.orderId,
        returnNumber,
        itemCount: data.items.length,
      })

      return this.get(ret.id)
    },

    async cancel(id: string, actorId?: string) {
      const ret = await repo.findById(id)
      if (!ret) throw new ServiceError('Order return not found', 404)
      if (ret.status !== 'PENDING') throw new ServiceError('Only PENDING returns can be cancelled', 400)

      const updated = await repo.update(id, { status: 'CANCELLED' })
      await auditRepo.log('order_return', id, 'cancel', actorId, { previousStatus: 'PENDING' })
      return updated
    },

    async approve(id: string, actorId: string) {
      const ret = await repo.findById(id)
      if (!ret) throw new ServiceError('Order return not found', 404)
      if (ret.status !== 'PENDING') throw new ServiceError('Only PENDING returns can be approved', 400)

      const o = await ordersRepo.findById(ret.orderId)
      if (!o) throw new ServiceError('Order not found', 404)

      const items = await repo.findItems(id)

      // Re-stock returned items + create RETURN movements
      for (const item of items) {
        const stock = await inventoryRepo.findByVariantAndLocation(item.variantId, o.fulfillmentLocationId)
        if (!stock) {
          // Upsert if no stock row exists (item was depleted to 0 or location changed)
          await inventoryRepo.upsertStock(item.variantId, o.fulfillmentLocationId, item.quantity)
        } else {
          await inventoryRepo.incrementStock(item.variantId, o.fulfillmentLocationId, item.quantity)
        }

        await inventoryRepo.createMovement({
          variantId: item.variantId,
          locationId: o.fulfillmentLocationId,
          movementType: 'RETURN',
          quantity: item.quantity,
          referenceType: 'order_return',
          referenceId: id,
        })
      }

      const updated = await repo.update(id, { status: 'APPROVED', approvedBy: actorId })

      await ordersRepo.addTimeline({
        orderId: ret.orderId,
        event: 'RETURN_APPROVED',
        note: `Approved return ${ret.returnNumber}`,
        actorId,
      })

      await auditRepo.log('order_return', id, 'approve', actorId, { itemCount: items.length })

      return updated
    },
  }
}
