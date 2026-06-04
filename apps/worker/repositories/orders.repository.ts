import { eq, and, desc, sql } from 'drizzle-orm'
import { order, orderItem, orderAddress, orderTimeline } from '@repo/database/schema'
import type { Database, NewOrder, NewOrderItem, NewOrderAddress, NewOrderTimeline } from '@repo/database'
import { generateId } from '../utils/id'

export function createOrdersRepository(db: Database, organizationId: string) {
  const scope = eq(order.organizationId, organizationId)

  return {
    findMany(status?: Order['status']) {
      const where = status ? and(scope, eq(order.status, status)) : scope
      return db.select().from(order).where(where).orderBy(desc(order.createdAt))
    },

    findById(id: string) {
      return db.select().from(order)
        .where(and(scope, eq(order.id, id)))
        .then(r => r[0] ?? null)
    },

    findByNumber(orderNumber: string) {
      return db.select().from(order)
        .where(and(scope, eq(order.orderNumber, orderNumber)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewOrder, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewOrder = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(order).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewOrder, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(order)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(order.id, id)))
      return this.findById(id)
    },

    // Items

    findItems(orderId: string) {
      return db.select().from(orderItem)
        .where(eq(orderItem.orderId, orderId))
        .orderBy(orderItem.createdAt)
    },

    async addItem(data: Omit<NewOrderItem, 'id' | 'createdAt'>) {
      const row: NewOrderItem = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(orderItem).values(row)
      return row
    },

    // Address

    findAddress(orderId: string) {
      return db.select().from(orderAddress)
        .where(eq(orderAddress.orderId, orderId))
        .then(r => r[0] ?? null)
    },

    async setAddress(data: Omit<NewOrderAddress, 'id' | 'createdAt'>) {
      // Delete existing address for this order first (upsert pattern)
      await db.delete(orderAddress).where(eq(orderAddress.orderId, data.orderId))
      const row: NewOrderAddress = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(orderAddress).values(row)
      return row
    },

    // Timeline

    async addTimeline(data: { orderId: string; event: string; note?: string; actorId?: string }) {
      const row: NewOrderTimeline = {
        id: generateId(),
        organizationId,
        orderId: data.orderId,
        event: data.event,
        note: data.note ?? null,
        actorId: data.actorId ?? null,
        createdAt: new Date(),
      }
      await db.insert(orderTimeline).values(row)
      return row
    },

    findTimeline(orderId: string) {
      return db.select().from(orderTimeline)
        .where(and(eq(orderTimeline.organizationId, organizationId), eq(orderTimeline.orderId, orderId)))
        .orderBy(orderTimeline.createdAt)
    },

    // Count helpers

    async countByOrg(): Promise<number> {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(order)
        .where(scope)
      return result[0]?.count ?? 0
    },

    async countByOrgThisMonth(): Promise<number> {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(order)
        .where(and(scope, sql`${order.createdAt} >= ${startOfMonth.getTime() / 1000}`))
      return result[0]?.count ?? 0
    },
  }
}

type Order = typeof order.$inferSelect
export type OrdersRepository = ReturnType<typeof createOrdersRepository>
