import { eq, and, desc, sql } from 'drizzle-orm'
import { posSale, posSaleItem, posSalePayment } from '@repo/database/schema'
import type { Database, NewPosSale, NewPosSaleItem, NewPosSalePayment } from '@repo/database'
import { generateId } from '../utils/id'

export function createPosSalesRepository(db: Database, organizationId: string) {
  const scope = eq(posSale.organizationId, organizationId)

  return {
    findMany(status?: PosSale['status']) {
      const where = status ? and(scope, eq(posSale.status, status)) : scope
      return db.select().from(posSale).where(where).orderBy(desc(posSale.createdAt))
    },

    findById(id: string) {
      return db.select().from(posSale)
        .where(and(scope, eq(posSale.id, id)))
        .then(r => r[0] ?? null)
    },

    findBySession(sessionId: string, status?: PosSale['status']) {
      const where = status
        ? and(scope, eq(posSale.sessionId, sessionId), eq(posSale.status, status))
        : and(scope, eq(posSale.sessionId, sessionId))
      return db.select().from(posSale).where(where).orderBy(desc(posSale.createdAt))
    },

    async create(data: Omit<NewPosSale, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewPosSale = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(posSale).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewPosSale, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(posSale)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(posSale.id, id)))
      return this.findById(id)
    },

    // Items

    findItems(saleId: string) {
      return db.select().from(posSaleItem)
        .where(eq(posSaleItem.saleId, saleId))
        .orderBy(posSaleItem.createdAt)
    },

    async addItem(data: Omit<NewPosSaleItem, 'id' | 'createdAt'>) {
      const row: NewPosSaleItem = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(posSaleItem).values(row)
      return row
    },

    // Payments

    findPayments(saleId: string) {
      return db.select().from(posSalePayment)
        .where(and(eq(posSalePayment.organizationId, organizationId), eq(posSalePayment.saleId, saleId)))
    },

    async addPayment(data: Omit<NewPosSalePayment, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewPosSalePayment = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(posSalePayment).values(row)
      return row
    },

    async countByOrg(): Promise<number> {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(posSale)
        .where(scope)
      return result[0]?.count ?? 0
    },
  }
}

type PosSale = typeof posSale.$inferSelect
export type PosSalesRepository = ReturnType<typeof createPosSalesRepository>
