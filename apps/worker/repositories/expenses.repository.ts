import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { finExpense } from '@repo/database/schema'
import type { Database, NewFinExpense } from '@repo/database'
import { generateId } from '../utils/id'

export function createExpensesRepository(db: Database, organizationId: string) {
  const scope = eq(finExpense.organizationId, organizationId)

  return {
    findMany(status?: FinExpense['status'], category?: FinExpense['category']) {
      const conditions = [scope] as ReturnType<typeof eq>[]
      if (status) conditions.push(eq(finExpense.status, status))
      if (category) conditions.push(eq(finExpense.category, category))
      return db.select().from(finExpense)
        .where(and(...conditions))
        .orderBy(desc(finExpense.createdAt))
    },

    findById(id: string) {
      return db.select().from(finExpense)
        .where(and(scope, eq(finExpense.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewFinExpense, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewFinExpense = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(finExpense).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewFinExpense, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(finExpense)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(finExpense.id, id)))
      return this.findById(id)
    },

    async totalApproved(from?: Date, to?: Date): Promise<number> {
      const conditions = [scope, eq(finExpense.status, 'APPROVED')] as any[]
      if (from) conditions.push(gte(finExpense.createdAt, from))
      if (to) conditions.push(lte(finExpense.createdAt, to))
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${finExpense.amount}), 0)` })
        .from(finExpense)
        .where(and(...conditions))
      return result[0]?.total ?? 0
    },
  }
}

type FinExpense = typeof finExpense.$inferSelect
export type ExpensesRepository = ReturnType<typeof createExpensesRepository>
