import { eq, and, sql } from 'drizzle-orm'
import { finAccount } from '@repo/database/schema'
import type { Database, NewFinAccount } from '@repo/database'
import { generateId } from '../utils/id'

export function createAccountsRepository(db: Database, organizationId: string) {
  const scope = eq(finAccount.organizationId, organizationId)

  return {
    findMany() {
      return db.select().from(finAccount).where(scope).orderBy(finAccount.name)
    },

    findById(id: string) {
      return db.select().from(finAccount)
        .where(and(scope, eq(finAccount.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: { name: string; type: FinAccount['type']; openingBalance?: number }) {
      const now = new Date()
      const opening = data.openingBalance ?? 0
      const row: NewFinAccount = {
        id: generateId(),
        organizationId,
        name: data.name,
        type: data.type,
        openingBalance: opening,
        currentBalance: opening,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      }
      await db.insert(finAccount).values(row)
      return row
    },

    async update(id: string, data: { name?: string; status?: 'ACTIVE' | 'INACTIVE' }) {
      await db.update(finAccount)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(finAccount.id, id)))
      return this.findById(id)
    },

    async adjustBalance(id: string, delta: number) {
      await db.update(finAccount)
        .set({
          currentBalance: sql`${finAccount.currentBalance} + ${delta}`,
          updatedAt: new Date(),
        })
        .where(and(scope, eq(finAccount.id, id)))
    },

    async totalBalance(): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${finAccount.currentBalance}), 0)` })
        .from(finAccount)
        .where(and(scope, eq(finAccount.status, 'ACTIVE')))
      return result[0]?.total ?? 0
    },
  }
}

type FinAccount = typeof finAccount.$inferSelect
export type AccountsRepository = ReturnType<typeof createAccountsRepository>
