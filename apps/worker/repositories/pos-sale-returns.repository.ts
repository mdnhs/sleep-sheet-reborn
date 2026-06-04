import { eq, and, sql } from 'drizzle-orm'
import { posSaleReturn, posSaleReturnItem } from '@repo/database/schema'
import type { Database, NewPosSaleReturn, NewPosSaleReturnItem } from '@repo/database'
import { generateId } from '../utils/id'

export function createPosSaleReturnsRepository(db: Database, organizationId: string) {
  const scope = eq(posSaleReturn.organizationId, organizationId)

  return {
    findMany(saleId?: string, status?: PosSaleReturn['status']) {
      let where = scope as ReturnType<typeof and>
      if (saleId) where = and(where, eq(posSaleReturn.saleId, saleId))
      if (status) where = and(where, eq(posSaleReturn.status, status))
      return db.select().from(posSaleReturn)
        .where(where)
        .orderBy(sql`${posSaleReturn.createdAt} DESC`)
    },

    findById(id: string) {
      return db.select().from(posSaleReturn)
        .where(and(scope, eq(posSaleReturn.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewPosSaleReturn, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewPosSaleReturn = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(posSaleReturn).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewPosSaleReturn, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(posSaleReturn)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(posSaleReturn.id, id)))
      return this.findById(id)
    },

    findItems(returnId: string) {
      return db.select().from(posSaleReturnItem)
        .where(eq(posSaleReturnItem.returnId, returnId))
    },

    async addItem(data: Omit<NewPosSaleReturnItem, 'id' | 'createdAt'>) {
      const row: NewPosSaleReturnItem = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(posSaleReturnItem).values(row)
      return row
    },

    async getTotalReturnedQty(saleItemId: string): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${posSaleReturnItem.quantity}), 0)` })
        .from(posSaleReturnItem)
        .innerJoin(posSaleReturn, eq(posSaleReturnItem.returnId, posSaleReturn.id))
        .where(and(
          eq(posSaleReturn.organizationId, organizationId),
          eq(posSaleReturnItem.saleItemId, saleItemId),
          sql`${posSaleReturn.status} != 'CANCELLED'`,
        ))
      return result[0]?.total ?? 0
    },

    async countByOrg(): Promise<number> {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(posSaleReturn)
        .where(scope)
      return result[0]?.count ?? 0
    },
  }
}

type PosSaleReturn = typeof posSaleReturn.$inferSelect
export type PosSaleReturnsRepository = ReturnType<typeof createPosSaleReturnsRepository>
