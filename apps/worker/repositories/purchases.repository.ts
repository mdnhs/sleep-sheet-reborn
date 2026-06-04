import { eq, and, desc, sql } from 'drizzle-orm'
import { purchaseOrder, purchaseItem } from '@repo/database/schema'
import type { Database, NewPurchaseOrder, NewPurchaseItem } from '@repo/database'
import { generateId } from '../utils/id'

export function createPurchasesRepository(db: Database, organizationId: string) {
  const scope = eq(purchaseOrder.organizationId, organizationId)

  return {
    findMany(status?: PurchaseOrder['status']) {
      const where = status ? and(scope, eq(purchaseOrder.status, status)) : scope
      return db.select().from(purchaseOrder).where(where).orderBy(desc(purchaseOrder.createdAt))
    },

    findById(id: string) {
      return db.select().from(purchaseOrder)
        .where(and(scope, eq(purchaseOrder.id, id)))
        .then(r => r[0] ?? null)
    },

    findByNumber(purchaseNumber: string) {
      return db.select().from(purchaseOrder)
        .where(and(scope, eq(purchaseOrder.purchaseNumber, purchaseNumber)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewPurchaseOrder, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewPurchaseOrder = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(purchaseOrder).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewPurchaseOrder, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(purchaseOrder)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(purchaseOrder.id, id)))
      return this.findById(id)
    },

    // Items

    findItems(purchaseOrderId: string) {
      return db.select().from(purchaseItem)
        .where(eq(purchaseItem.purchaseOrderId, purchaseOrderId))
        .orderBy(purchaseItem.createdAt)
    },

    async addItem(data: Omit<NewPurchaseItem, 'id' | 'createdAt'>) {
      const row: NewPurchaseItem = { ...data, id: generateId(), createdAt: new Date() }
      await db.insert(purchaseItem).values(row)
      return row
    },

    async updateItemReceived(itemId: string, receivedQuantity: number) {
      await db.update(purchaseItem)
        .set({ receivedQuantity })
        .where(eq(purchaseItem.id, itemId))
    },

    async countByOrg(): Promise<number> {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(purchaseOrder)
        .where(and(scope))
      return result[0]?.count ?? 0
    },

    async getTotalPurchased(supplierId: string): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${purchaseOrder.grandTotal}), 0)` })
        .from(purchaseOrder)
        .where(and(
          scope,
          eq(purchaseOrder.supplierId, supplierId),
          sql`${purchaseOrder.status} IN ('RECEIVED', 'COMPLETED')`,
        ))
      return result[0]?.total ?? 0
    },
  }
}

type PurchaseOrder = typeof purchaseOrder.$inferSelect
export type PurchasesRepository = ReturnType<typeof createPurchasesRepository>
