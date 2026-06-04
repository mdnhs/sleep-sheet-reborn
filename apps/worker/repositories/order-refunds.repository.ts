import { eq, and, desc } from 'drizzle-orm'
import { orderRefund } from '@repo/database/schema'
import type { Database, NewOrderRefund } from '@repo/database'
import { generateId } from '../utils/id'

export function createOrderRefundsRepository(db: Database, organizationId: string) {
  const scope = eq(orderRefund.organizationId, organizationId)

  return {
    findMany(orderId?: string) {
      const conditions = [scope]
      if (orderId) conditions.push(eq(orderRefund.orderId, orderId))
      return db.select().from(orderRefund).where(and(...conditions)).orderBy(desc(orderRefund.createdAt))
    },

    findById(id: string) {
      return db.select().from(orderRefund)
        .where(and(scope, eq(orderRefund.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewOrderRefund, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewOrderRefund = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(orderRefund).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewOrderRefund, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(orderRefund)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(orderRefund.id, id)))
      return this.findById(id)
    },
  }
}

export type OrderRefundsRepository = ReturnType<typeof createOrderRefundsRepository>
