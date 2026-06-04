import { eq, and, desc, sql } from 'drizzle-orm'
import { supplier, supplierPayment } from '@repo/database/schema'
import type { Database, NewSupplier, NewSupplierPayment } from '@repo/database'
import { generateId } from '../utils/id'

export function createSupplierRepository(db: Database, organizationId: string) {
  const scope = eq(supplier.organizationId, organizationId)
  const paymentScope = eq(supplierPayment.organizationId, organizationId)

  return {
    findMany(status?: Supplier['status']) {
      const where = status ? and(scope, eq(supplier.status, status)) : scope
      return db.select().from(supplier).where(where).orderBy(desc(supplier.createdAt))
    },

    findById(id: string) {
      return db.select().from(supplier)
        .where(and(scope, eq(supplier.id, id)))
        .then(r => r[0] ?? null)
    },

    findByPhone(phone: string) {
      return db.select().from(supplier)
        .where(and(scope, eq(supplier.phone, phone)))
        .then(r => r[0] ?? null)
    },

    async create(data: Omit<NewSupplier, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewSupplier = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(supplier).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewSupplier, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(supplier)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(supplier.id, id)))
      return this.findById(id)
    },

    // Payments

    findPayments(supplierId: string) {
      return db.select().from(supplierPayment)
        .where(and(paymentScope, eq(supplierPayment.supplierId, supplierId)))
        .orderBy(desc(supplierPayment.createdAt))
    },

    async createPayment(data: Omit<NewSupplierPayment, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewSupplierPayment = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(supplierPayment).values(row)
      return row
    },

    async getTotalPaid(supplierId: string): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${supplierPayment.amount}), 0)` })
        .from(supplierPayment)
        .where(and(paymentScope, eq(supplierPayment.supplierId, supplierId)))
      return result[0]?.total ?? 0
    },
  }
}

type Supplier = typeof supplier.$inferSelect
export type SupplierRepository = ReturnType<typeof createSupplierRepository>
