import type { Database } from '@repo/database'
import { createOrdersRepository } from '../../repositories/orders.repository'
import { createInventoryReservationRepository } from '../../repositories/inventory-reservation.repository'
import { createInventoryRepository } from '../../repositories/inventory.repository'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { createLocationRepository } from '../../repositories/locations.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'
import { enforceSubscriptionActive, enforceLimit } from '../../utils/plan-limits'
import { awardLoyalty, notifyOrg } from './integrations'

export function createOrdersService(db: Database, organizationId: string) {
  const repo = createOrdersRepository(db, organizationId)
  const reservationRepo = createInventoryReservationRepository(db, organizationId)
  const inventoryRepo = createInventoryRepository(db, organizationId)
  const variantRepo = createProductVariantRepository(db, organizationId)
  const locationRepo = createLocationRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function assertLocation(id: string) {
    const l = await locationRepo.findLocationById(id)
    if (!l) throw new ServiceError('Location not found', 404)
    return l
  }

  async function nextOrderNumber(): Promise<string> {
    const count = await repo.countByOrg()
    return `ORD-${String(count + 1).padStart(6, '0')}`
  }

  return {
    async list(status?: string) {
      const orders = await repo.findMany(status as any)
      return orders
    },

    async get(id: string) {
      const o = await repo.findById(id)
      if (!o) throw new ServiceError('Order not found', 404)
      const [items, address, timeline] = await Promise.all([
        repo.findItems(id),
        repo.findAddress(id),
        repo.findTimeline(id),
      ])
      return { ...o, items, address, timeline }
    },

    async create(data: {
      items: Array<{ variantId: string; quantity: number; unitPrice: number; discount?: number }>
      address: { name: string; phone: string; address: string; area?: string; city: string }
      locationId: string
      source?: 'POS' | 'WEBSITE' | 'FUNNEL' | 'MANUAL' | 'API'
      paymentMethod?: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'BANK' | 'WALLET'
      notes?: string
      customerNotes?: string
      customerId?: string
      campaignId?: string
      funnelId?: string
      utmSource?: string
      utmMedium?: string
      utmCampaign?: string
      discount?: number
      tax?: number
      shippingCost?: number
      actorId?: string
    }) {
      if (!data.items.length) throw new ServiceError('Order must have at least one item', 400)

      // Plan enforcement: block writes on inactive subscription; cap orders/month
      await enforceSubscriptionActive(db, organizationId)
      await enforceLimit(db, organizationId, 'limitOrdersPerMonth', await repo.countByOrgThisMonth())

      await assertLocation(data.locationId)

      for (const item of data.items) {
        if (item.quantity <= 0) throw new ServiceError('Item quantity must be positive', 400)
        if (item.unitPrice < 0) throw new ServiceError('Unit price cannot be negative', 400)
        const variant = await variantRepo.findById(item.variantId)
        if (!variant) throw new ServiceError(`Variant ${item.variantId} not found`, 404)
      }

      // Check available stock (actual quantity minus active reservations)
      for (const item of data.items) {
        const stock = await inventoryRepo.findByVariantAndLocation(item.variantId, data.locationId)
        const actualQty = stock?.quantity ?? 0
        const reservedQty = await reservationRepo.findActiveByVariantAndLocation(item.variantId, data.locationId)
        const available = actualQty - reservedQty
        if (available < item.quantity) {
          throw new ServiceError(
            `Insufficient stock for variant ${item.variantId}: available=${available}, requested=${item.quantity}`,
            400,
          )
        }
      }

      const discount = data.discount ?? 0
      const tax = data.tax ?? 0
      const shippingCost = data.shippingCost ?? 0
      const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice - (i.discount ?? 0), 0)
      const grandTotal = subtotal + tax + shippingCost - discount

      const orderNumber = await nextOrderNumber()

      const o = await repo.create({
        customerId: data.customerId ?? null,
        fulfillmentLocationId: data.locationId,
        orderNumber,
        source: data.source ?? 'MANUAL',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: data.paymentMethod ?? null,
        subtotal,
        discount,
        tax,
        shippingCost,
        grandTotal,
        notes: data.notes ?? null,
        customerNotes: data.customerNotes ?? null,
        campaignId: data.campaignId ?? null,
        funnelId: data.funnelId ?? null,
        utmSource: data.utmSource ?? null,
        utmMedium: data.utmMedium ?? null,
        utmCampaign: data.utmCampaign ?? null,
        deliveredAt: null,
      })

      for (const item of data.items) {
        const itemDiscount = item.discount ?? 0
        const lineTotal = item.quantity * item.unitPrice - itemDiscount
        await repo.addItem({
          orderId: o.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: itemDiscount,
          lineTotal,
        })
      }

      await repo.setAddress({
        orderId: o.id,
        name: data.address.name,
        phone: data.address.phone,
        address: data.address.address,
        area: data.address.area ?? null,
        city: data.address.city,
      })

      // Create inventory reservations
      for (const item of data.items) {
        await reservationRepo.createReservation({
          variantId: item.variantId,
          orderId: o.id,
          locationId: data.locationId,
          quantity: item.quantity,
        })
      }

      await repo.addTimeline({ orderId: o.id, event: 'ORDER_CREATED', actorId: data.actorId })

      await auditRepo.log('order', o.id, 'create', data.actorId, {
        orderNumber,
        grandTotal,
        itemCount: data.items.length,
        source: data.source ?? 'MANUAL',
      })

      await notifyOrg(db, organizationId, { title: `New order ${orderNumber}`, body: `${data.items.length} item(s) · ${grandTotal}`, type: 'INFO', entityType: 'order', entityId: o.id })

      return this.get(o.id)
    },

    async confirm(id: string, actorId: string) {
      const o = await repo.findById(id)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status !== 'PENDING') throw new ServiceError('Only PENDING orders can be confirmed', 400)

      await repo.update(id, { status: 'CONFIRMED' })
      await repo.addTimeline({ orderId: id, event: 'ORDER_CONFIRMED', actorId })
      return this.get(id)
    },

    async process(id: string, actorId: string) {
      const o = await repo.findById(id)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status !== 'CONFIRMED') throw new ServiceError('Only CONFIRMED orders can be set to PROCESSING', 400)

      await repo.update(id, { status: 'PROCESSING' })
      await repo.addTimeline({ orderId: id, event: 'ORDER_PROCESSING', actorId })
      return this.get(id)
    },

    async pack(id: string, actorId: string) {
      const o = await repo.findById(id)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status !== 'PROCESSING') throw new ServiceError('Only PROCESSING orders can be packed', 400)

      await repo.update(id, { status: 'PACKED' })
      await repo.addTimeline({ orderId: id, event: 'ORDER_PACKED', actorId })
      return this.get(id)
    },

    async ship(id: string, actorId: string) {
      const o = await repo.findById(id)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status !== 'PACKED') throw new ServiceError('Only PACKED orders can be shipped', 400)

      await repo.update(id, { status: 'SHIPPED' })
      await repo.addTimeline({ orderId: id, event: 'ORDER_SHIPPED', actorId })
      return this.get(id)
    },

    async deliver(id: string, actorId: string) {
      const o = await repo.findById(id)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status !== 'SHIPPED') throw new ServiceError('Only SHIPPED orders can be delivered', 400)

      // Consume reservations
      await reservationRepo.consumeByOrder(id)

      // Decrement stock + create ONLINE_SALE movements
      const items = await repo.findItems(id)
      for (const item of items) {
        await inventoryRepo.decrementStock(item.variantId, o.fulfillmentLocationId, item.quantity)
        await inventoryRepo.createMovement({
          variantId: item.variantId,
          locationId: o.fulfillmentLocationId,
          movementType: 'ONLINE_SALE',
          quantity: -item.quantity,
          referenceType: 'order',
          referenceId: id,
        })
      }

      await repo.update(id, { status: 'DELIVERED', deliveredAt: new Date() })
      await repo.addTimeline({ orderId: id, event: 'ORDER_DELIVERED', actorId })
      await auditRepo.log('order', id, 'deliver', actorId, { itemCount: items.length })

      // Loyalty is awarded only after a completed (delivered) sale.
      await awardLoyalty(db, organizationId, o.customerId, o.grandTotal, { source: 'ORDER', type: 'order', id })
      await notifyOrg(db, organizationId, { title: `Order ${o.orderNumber} delivered`, type: 'SUCCESS', entityType: 'order', entityId: id })

      return this.get(id)
    },

    async cancel(id: string, actorId: string) {
      const o = await repo.findById(id)
      if (!o) throw new ServiceError('Order not found', 404)
      if (o.status === 'DELIVERED') throw new ServiceError('Delivered orders cannot be cancelled', 400)
      if (o.status === 'CANCELLED') throw new ServiceError('Order already cancelled', 400)

      // Release reservations
      await reservationRepo.releaseByOrder(id)

      await repo.update(id, { status: 'CANCELLED' })
      await repo.addTimeline({ orderId: id, event: 'ORDER_CANCELLED', actorId })
      await auditRepo.log('order', id, 'cancel', actorId, { previousStatus: o.status })

      return this.get(id)
    },
  }
}
