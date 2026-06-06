import { eq, and, desc, sql } from 'drizzle-orm'
import { shipment, shipmentEvent } from '@repo/database/schema'
import type { Database, NewShipment, NewShipmentEvent, Shipment } from '@repo/database'
import { generateId } from '../utils/id'

export function createShipmentsRepository(db: Database, organizationId: string) {
  const scope = eq(shipment.organizationId, organizationId)
  const evScope = eq(shipmentEvent.organizationId, organizationId)

  return {
    findMany(status?: Shipment['status']) {
      const conditions = [scope] as ReturnType<typeof eq>[]
      if (status) conditions.push(eq(shipment.status, status))
      return db.select().from(shipment).where(and(...conditions)).orderBy(desc(shipment.createdAt))
    },

    findById(id: string) {
      return db.select().from(shipment)
        .where(and(scope, eq(shipment.id, id)))
        .then(r => r[0] ?? null)
    },

    findByOrder(orderId: string) {
      return db.select().from(shipment)
        .where(and(scope, eq(shipment.orderId, orderId)))
        .then(r => r[0] ?? null)
    },

    findByTracking(trackingNumber: string) {
      return db.select().from(shipment)
        .where(and(scope, eq(shipment.trackingNumber, trackingNumber)))
        .then(r => r[0] ?? null)
    },

    async countByOrg(): Promise<number> {
      const r = await db.select({ n: sql<number>`COUNT(*)` }).from(shipment).where(scope)
      return r[0]?.n ?? 0
    },

    async create(data: Omit<NewShipment, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewShipment = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(shipment).values(row)
      return row
    },

    async update(id: string, data: Partial<Pick<Shipment, 'status' | 'riderId' | 'deliveryPartnerId' | 'courierStatus' | 'codAmount'>>) {
      await db.update(shipment)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(shipment.id, id)))
      return this.findById(id)
    },

    // ── Events (immutable) ──────────────────────────────────────────────────────

    findEvents(shipmentId: string) {
      return db.select().from(shipmentEvent)
        .where(and(evScope, eq(shipmentEvent.shipmentId, shipmentId)))
        .orderBy(desc(shipmentEvent.createdAt))
    },

    async addEvent(data: { shipmentId: string; status: string; note?: string | null }) {
      const row: NewShipmentEvent = {
        id: generateId(), organizationId,
        shipmentId: data.shipmentId, status: data.status, note: data.note ?? null,
        createdAt: new Date(),
      }
      await db.insert(shipmentEvent).values(row)
      return row
    },
  }
}

export type ShipmentsRepository = ReturnType<typeof createShipmentsRepository>
