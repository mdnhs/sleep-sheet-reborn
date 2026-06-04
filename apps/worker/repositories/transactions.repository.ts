import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { finTransaction } from '@repo/database/schema'
import type { Database, NewFinTransaction } from '@repo/database'
import { generateId } from '../utils/id'

export function createTransactionsRepository(db: Database, organizationId: string) {
  const scope = eq(finTransaction.organizationId, organizationId)

  return {
    findMany(filters?: {
      accountId?: string
      type?: FinTransaction['type']
      from?: Date
      to?: Date
    }) {
      const conditions = [scope] as ReturnType<typeof eq>[]
      if (filters?.accountId) conditions.push(eq(finTransaction.accountId, filters.accountId))
      if (filters?.type) conditions.push(eq(finTransaction.type, filters.type))
      if (filters?.from) conditions.push(gte(finTransaction.createdAt, filters.from) as any)
      if (filters?.to) conditions.push(lte(finTransaction.createdAt, filters.to) as any)
      return db.select().from(finTransaction)
        .where(and(...conditions))
        .orderBy(desc(finTransaction.createdAt))
    },

    findById(id: string) {
      return db.select().from(finTransaction)
        .where(and(scope, eq(finTransaction.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewFinTransaction, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewFinTransaction = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(finTransaction).values(row)
      return row
    },

    async totalIncome(from?: Date, to?: Date): Promise<number> {
      const conditions = [scope, sql`${finTransaction.amount} > 0`] as any[]
      if (from) conditions.push(gte(finTransaction.createdAt, from))
      if (to) conditions.push(lte(finTransaction.createdAt, to))
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${finTransaction.amount}), 0)` })
        .from(finTransaction)
        .where(and(...conditions))
      return result[0]?.total ?? 0
    },

    async totalExpenses(from?: Date, to?: Date): Promise<number> {
      const conditions = [scope, sql`${finTransaction.amount} < 0`] as any[]
      if (from) conditions.push(gte(finTransaction.createdAt, from))
      if (to) conditions.push(lte(finTransaction.createdAt, to))
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(ABS(${finTransaction.amount})), 0)` })
        .from(finTransaction)
        .where(and(...conditions))
      return result[0]?.total ?? 0
    },
  }
}

type FinTransaction = typeof finTransaction.$inferSelect
export type TransactionsRepository = ReturnType<typeof createTransactionsRepository>
