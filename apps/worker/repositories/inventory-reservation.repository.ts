import { eq, and, sql } from 'drizzle-orm'
import { inventoryReservation } from '@repo/database/schema'
import type { Database, NewInventoryReservation } from '@repo/database'
import { generateId } from '../utils/id'

export function createInventoryReservationRepository(db: Database, organizationId: string) {
  const scope = eq(inventoryReservation.organizationId, organizationId)

  return {
    async createReservation(data: { variantId: string; orderId: string; locationId: string; quantity: number }) {
      const now = new Date()
      const row: NewInventoryReservation = {
        id: generateId(),
        organizationId,
        variantId: data.variantId,
        orderId: data.orderId,
        locationId: data.locationId,
        quantity: data.quantity,
        status: 'RESERVED',
        createdAt: now,
        updatedAt: now,
      }
      await db.insert(inventoryReservation).values(row)
      return row
    },

    findByOrder(orderId: string) {
      return db.select().from(inventoryReservation)
        .where(and(scope, eq(inventoryReservation.orderId, orderId)))
    },

    async findActiveByVariantAndLocation(variantId: string, locationId: string): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${inventoryReservation.quantity}), 0)` })
        .from(inventoryReservation)
        .where(and(
          scope,
          eq(inventoryReservation.variantId, variantId),
          eq(inventoryReservation.locationId, locationId),
          eq(inventoryReservation.status, 'RESERVED'),
        ))
      return result[0]?.total ?? 0
    },

    async consumeByOrder(orderId: string) {
      await db.update(inventoryReservation)
        .set({ status: 'CONSUMED', updatedAt: new Date() })
        .where(and(scope, eq(inventoryReservation.orderId, orderId), eq(inventoryReservation.status, 'RESERVED')))
    },

    async releaseByOrder(orderId: string) {
      await db.update(inventoryReservation)
        .set({ status: 'RELEASED', updatedAt: new Date() })
        .where(and(scope, eq(inventoryReservation.orderId, orderId), eq(inventoryReservation.status, 'RESERVED')))
    },
  }
}

export type InventoryReservationRepository = ReturnType<typeof createInventoryReservationRepository>
