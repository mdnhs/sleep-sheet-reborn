import type { Database, Shipment } from '@repo/database'
import { createDeliveryPartnersRepository } from '../../repositories/delivery-partners.repository'
import { createRidersRepository } from '../../repositories/riders.repository'
import { createShipmentsRepository } from '../../repositories/shipments.repository'
import { createOrdersRepository } from '../../repositories/orders.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { createOrdersService } from './orders.service'
import { ServiceError } from '../../utils/service-error'

const TERMINAL: Shipment['status'][] = ['DELIVERED', 'RETURNED', 'CANCELLED']

export function createDeliveryService(db: Database, organizationId: string) {
  const partnerRepo = createDeliveryPartnersRepository(db, organizationId)
  const riderRepo = createRidersRepository(db, organizationId)
  const shipmentRepo = createShipmentsRepository(db, organizationId)
  const orderRepo = createOrdersRepository(db, organizationId)
  const auditRepo = createAuditLogRepository(db, organizationId)

  async function requireShipment(id: string) {
    const s = await shipmentRepo.findById(id)
    if (!s) throw new ServiceError('Shipment not found', 404)
    return s
  }

  function assertNotTerminal(s: Shipment) {
    if (TERMINAL.includes(s.status)) throw new ServiceError(`Shipment is ${s.status} and cannot change`, 400)
  }

  async function nextTrackingNumber(): Promise<string> {
    const count = await shipmentRepo.countByOrg()
    return `TRK-${String(count + 1).padStart(6, '0')}`
  }

  return {
    // ── Delivery partners ───────────────────────────────────────────────────────

    listPartners(status?: string) { return partnerRepo.findMany(status as any) },

    async createPartner(data: { name: string; code?: string; phone?: string; actorId?: string }) {
      const p = await partnerRepo.create({ name: data.name, code: data.code ?? null, phone: data.phone ?? null })
      await auditRepo.log('delivery_partner', p.id, 'create', data.actorId, { name: data.name })
      return p
    },

    async updatePartner(id: string, data: { name?: string; code?: string | null; phone?: string | null; status?: 'ACTIVE' | 'INACTIVE' }) {
      const existing = await partnerRepo.findById(id)
      if (!existing) throw new ServiceError('Partner not found', 404)
      return partnerRepo.update(id, data)
    },

    // ── Riders ──────────────────────────────────────────────────────────────────

    listRiders(status?: string) { return riderRepo.findMany(status as any) },

    async createRider(data: { name: string; phone: string; actorId?: string }) {
      const r = await riderRepo.create({ name: data.name, phone: data.phone })
      await auditRepo.log('rider', r.id, 'create', data.actorId, { name: data.name })
      return r
    },

    async updateRider(id: string, data: { name?: string; phone?: string; status?: 'AVAILABLE' | 'BUSY' | 'INACTIVE' }) {
      const existing = await riderRepo.findById(id)
      if (!existing) throw new ServiceError('Rider not found', 404)
      return riderRepo.update(id, data)
    },

    // ── Shipments ───────────────────────────────────────────────────────────────

    listShipments(status?: string) { return shipmentRepo.findMany(status as any) },

    async getShipment(id: string) {
      const s = await requireShipment(id)
      const events = await shipmentRepo.findEvents(id)
      return { ...s, events }
    },

    /** One shipment per order (V1). Cancelled orders cannot generate shipments. */
    async createShipment(data: {
      orderId: string
      deliveryPartnerId?: string
      originLocationId?: string
      codAmount?: number
      actorId?: string
    }) {
      const order = await orderRepo.findById(data.orderId)
      if (!order) throw new ServiceError('Order not found', 404)
      if (order.status === 'CANCELLED') throw new ServiceError('Cancelled orders cannot generate shipments', 400)

      const existing = await shipmentRepo.findByOrder(data.orderId)
      if (existing) throw new ServiceError('A shipment already exists for this order', 409)

      if (data.deliveryPartnerId) {
        const p = await partnerRepo.findById(data.deliveryPartnerId)
        if (!p) throw new ServiceError('Delivery partner not found', 404)
      }

      const trackingNumber = await nextTrackingNumber()
      const s = await shipmentRepo.create({
        orderId: data.orderId,
        trackingNumber,
        deliveryPartnerId: data.deliveryPartnerId ?? null,
        riderId: null,
        originLocationId: data.originLocationId ?? order.fulfillmentLocationId,
        status: 'CREATED',
        courierStatus: null,
        codAmount: data.codAmount ?? 0,
      })
      await shipmentRepo.addEvent({ shipmentId: s.id, status: 'CREATED', note: `Shipment ${trackingNumber} created` })
      await auditRepo.log('shipment', s.id, 'create', data.actorId, { orderId: data.orderId, trackingNumber })
      return s
    },

    async assignRider(id: string, riderId: string, actorId?: string) {
      const s = await requireShipment(id)
      assertNotTerminal(s)
      const r = await riderRepo.findById(riderId)
      if (!r) throw new ServiceError('Rider not found', 404)
      if (r.status === 'INACTIVE') throw new ServiceError('Rider is inactive', 400)

      const updated = await shipmentRepo.update(id, { riderId, status: s.status === 'CREATED' ? 'ASSIGNED' : s.status })
      await riderRepo.update(riderId, { status: 'BUSY' })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'ASSIGNED', note: `Assigned to rider ${r.name}` })
      await auditRepo.log('shipment', id, 'assign_rider', actorId, { riderId })
      return updated
    },

    async assignPartner(id: string, deliveryPartnerId: string, actorId?: string) {
      const s = await requireShipment(id)
      assertNotTerminal(s)
      const p = await partnerRepo.findById(deliveryPartnerId)
      if (!p) throw new ServiceError('Delivery partner not found', 404)
      const updated = await shipmentRepo.update(id, { deliveryPartnerId })
      await shipmentRepo.addEvent({ shipmentId: id, status: s.status, note: `Courier set to ${p.name}` })
      await auditRepo.log('shipment', id, 'assign_partner', actorId, { deliveryPartnerId })
      return updated
    },

    async pickup(id: string, actorId?: string) {
      const s = await requireShipment(id)
      if (s.status !== 'ASSIGNED') throw new ServiceError('Only ASSIGNED shipments can be picked up', 400)
      const updated = await shipmentRepo.update(id, { status: 'PICKED_UP' })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'PICKED_UP', note: 'Picked up' })
      await auditRepo.log('shipment', id, 'pickup', actorId, {})
      return updated
    },

    async transit(id: string, actorId?: string) {
      const s = await requireShipment(id)
      if (s.status !== 'PICKED_UP') throw new ServiceError('Only PICKED_UP shipments can move to transit', 400)
      const updated = await shipmentRepo.update(id, { status: 'IN_TRANSIT' })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'IN_TRANSIT', note: 'In transit' })
      await auditRepo.log('shipment', id, 'transit', actorId, {})
      return updated
    },

    /** Delivered shipments complete the order (consumes reservations + deducts stock). */
    async deliver(id: string, actorId: string) {
      const s = await requireShipment(id)
      if (s.status !== 'PICKED_UP' && s.status !== 'IN_TRANSIT') {
        throw new ServiceError('Only picked-up or in-transit shipments can be delivered', 400)
      }

      // Complete the order through the Orders service (single source of truth for
      // inventory). Order must be SHIPPED — its guard enforces the workflow.
      const ordersService = createOrdersService(db, organizationId)
      await ordersService.deliver(s.orderId, actorId)

      const updated = await shipmentRepo.update(id, { status: 'DELIVERED' })
      if (s.riderId) await riderRepo.update(s.riderId, { status: 'AVAILABLE' })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'DELIVERED', note: 'Delivered' })
      await auditRepo.log('shipment', id, 'deliver', actorId, { orderId: s.orderId })
      return updated
    },

    async fail(id: string, reason: string, actorId?: string) {
      const s = await requireShipment(id)
      assertNotTerminal(s)
      const updated = await shipmentRepo.update(id, { status: 'FAILED' })
      if (s.riderId) await riderRepo.update(s.riderId, { status: 'AVAILABLE' })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'FAILED', note: reason })
      await auditRepo.log('shipment', id, 'fail', actorId, { reason })
      return updated
    },

    async returnToOrigin(id: string, actorId?: string) {
      const s = await requireShipment(id)
      if (s.status !== 'FAILED') throw new ServiceError('Only FAILED shipments can be returned to origin', 400)
      const updated = await shipmentRepo.update(id, { status: 'RETURNED' })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'RETURNED', note: 'Returned to origin' })
      await auditRepo.log('shipment', id, 'rto', actorId, {})
      return updated
    },

    async cancel(id: string, actorId?: string) {
      const s = await requireShipment(id)
      if (s.status !== 'CREATED' && s.status !== 'ASSIGNED') {
        throw new ServiceError('Only CREATED or ASSIGNED shipments can be cancelled', 400)
      }
      const updated = await shipmentRepo.update(id, { status: 'CANCELLED' })
      if (s.riderId) await riderRepo.update(s.riderId, { status: 'AVAILABLE' })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'CANCELLED', note: 'Cancelled' })
      await auditRepo.log('shipment', id, 'cancel', actorId, {})
      return updated
    },

    /** External courier status sync — records an immutable event. */
    async syncCourierStatus(id: string, courierStatus: string, note?: string, actorId?: string) {
      await requireShipment(id)
      const updated = await shipmentRepo.update(id, { courierStatus })
      await shipmentRepo.addEvent({ shipmentId: id, status: 'COURIER_UPDATE', note: note ?? courierStatus })
      await auditRepo.log('shipment', id, 'courier_sync', actorId, { courierStatus })
      return updated
    },

    // ── Reports ───────────────────────────────────────────────────────────────────

    async getReports() {
      const all = await shipmentRepo.findMany()
      const total = all.length
      const delivered = all.filter(s => s.status === 'DELIVERED').length
      const failed = all.filter(s => s.status === 'FAILED').length
      const returned = all.filter(s => s.status === 'RETURNED').length
      const inProgress = all.filter(s => ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status)).length
      const successRate = total ? Math.round((delivered / total) * 100) : 0
      return { total, delivered, failed, returned, inProgress, successRate }
    },
  }
}
