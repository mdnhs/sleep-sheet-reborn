import { eq, and, desc, sql } from 'drizzle-orm'
import { purchaseReturn, purchaseReturnItem } from '@repo/database/schema'
import type { Database, NewPurchaseReturn, NewPurchaseReturnItem } from '@repo/database'
import { generateId } from '../utils/id'

export function createPurchaseReturnsRepository(db: Database, organizationId: string) {
  const scope = eq(purchaseReturn.organizationId, organizationId)

  return {
    findMany(purchaseOrderId?: string, status?: PurchaseReturn['status']) {
      const conditions = [scope]
      if (purchaseOrderId) conditions.push(eq(purchaseReturn.purchaseOrderId, purchaseOrderId))
      if (status) conditions.push(eq(purchaseReturn.status, status))
      return db.select().from(purchaseReturn).where(and(...conditions)).orderBy(desc(purchaseReturn.createdAt))
    },

    findById(id: string) {
      return db.select().from(purchaseReturn)
        .where(and(scope, eq(purchaseReturn.id, id)))
        .then(r => r[0] ?? null)
    },

    findByNumber(returnNumber: string) {
      return db.select().from(purchaseReturn)
        .where(and(scope, eq(purchaseReturn.returnNumber, returnNumber)))
        .then(r => r[0] ?? null)
    },

    findItems(purchaseReturnId: string) {
      return db.select().from(purchaseReturnItem)
        .where(eq(purchaseReturnItem.purchaseReturnId, purchaseReturnId))
        .orderBy(purchaseReturnItem.createdAt)
    },

    async create(data: Omit<NewPurchaseReturn, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewPurchaseReturn = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(purchaseReturn).values(row)
      return row
    },

    async addItem(data: Omit<NewPurchaseReturnItem, 'id' | 'createdAt'>) {
      const row: NewPurchaseReturnItem = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(purchaseReturnItem).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewPurchaseReturn, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(purchaseReturn)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(purchaseReturn.id, id)))
      return this.findById(id)
    },

    async countByOrg(): Promise<number> {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(purchaseReturn)
        .where(scope)
      return result[0]?.count ?? 0
    },

    // Sum of quantity already returned (approved) for a given purchase_item — enforces max return qty
    async getTotalReturnedQty(purchaseItemId: string): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${purchaseReturnItem.quantity}), 0)` })
        .from(purchaseReturnItem)
        .innerJoin(purchaseReturn, eq(purchaseReturnItem.purchaseReturnId, purchaseReturn.id))
        .where(and(
          scope,
          eq(purchaseReturnItem.purchaseItemId, purchaseItemId),
          sql`${purchaseReturn.status} IN ('APPROVED')`,
        ))
      return result[0]?.total ?? 0
    },
  }
}

type PurchaseReturn = typeof purchaseReturn.$inferSelect
export type PurchaseReturnsRepository = ReturnType<typeof createPurchaseReturnsRepository>
