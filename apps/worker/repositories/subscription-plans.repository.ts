import { eq } from 'drizzle-orm'
import { subscriptionPlan } from '@repo/database/schema'
import type { Database, NewSubscriptionPlan, SubscriptionPlan } from '@repo/database'
import { generateId } from '../utils/id'

/** Plans are GLOBAL (platform-owned, not tenant-scoped). */
export function createSubscriptionPlansRepository(db: Database) {
  return {
    findMany(activeOnly = false) {
      const q = db.select().from(subscriptionPlan)
      return activeOnly
        ? q.where(eq(subscriptionPlan.status, 'ACTIVE')).orderBy(subscriptionPlan.price)
        : q.orderBy(subscriptionPlan.price)
    },

    findById(id: string) {
      return db.select().from(subscriptionPlan)
        .where(eq(subscriptionPlan.id, id))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewSubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewSubscriptionPlan = { ...data, id: generateId(), createdAt: now, updatedAt: now }
      await db.insert(subscriptionPlan).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>>) {
      await db.update(subscriptionPlan)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(subscriptionPlan.id, id))
      return this.findById(id)
    },
  }
}

export type SubscriptionPlansRepository = ReturnType<typeof createSubscriptionPlansRepository>
