import { eq, and, desc, sql } from 'drizzle-orm'
import { orderReturn, orderReturnItem } from '@repo/database/schema'
import type { Database, NewOrderReturn, NewOrderReturnItem } from '@repo/database'
import { generateId } from '../utils/id'

export function createOrderReturnsRepository(db: Database, organizationId: string) {
  const scope = eq(orderReturn.organizationId, organizationId)

  return {
    findMany(orderId?: string, status?: OrderReturn['status']) {
      const conditions = [scope]
      if (orderId) conditions.push(eq(orderReturn.orderId, orderId))
      if (status) conditions.push(eq(orderReturn.status, status))
      return db.select().from(orderReturn).where(and(...conditions)).orderBy(desc(orderReturn.createdAt))
    },

    findById(id: string) {
      return db.select().from(orderReturn)
        .where(and(scope, eq(orderReturn.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewOrderReturn, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewOrderReturn = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(orderReturn).values(row)
      return row
    },

    async addItem(data: Omit<NewOrderReturnItem, 'id' | 'createdAt'>) {
      const row: NewOrderReturnItem = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(orderReturnItem).values(row)
      return row
    },

    findItems(returnId: string) {
      return db.select().from(orderReturnItem)
        .where(eq(orderReturnItem.orderReturnId, returnId))
        .orderBy(orderReturnItem.createdAt)
    },

    async update(id: string, data: Partial<Omit<NewOrderReturn, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(orderReturn)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(orderReturn.id, id)))
      return this.findById(id)
    },

    async countByOrg(): Promise<number> {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orderReturn)
        .where(scope)
      return result[0]?.count ?? 0
    },

    async getTotalReturnedQty(orderItemId: string): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${orderReturnItem.quantity}), 0)` })
        .from(orderReturnItem)
        .innerJoin(orderReturn, eq(orderReturnItem.orderReturnId, orderReturn.id))
        .where(and(
          scope,
          eq(orderReturnItem.orderItemId, orderItemId),
          sql`${orderReturn.status} IN ('APPROVED')`,
        ))
      return result[0]?.total ?? 0
    },
  }
}

type OrderReturn = typeof orderReturn.$inferSelect
export type OrderReturnsRepository = ReturnType<typeof createOrderReturnsRepository>
