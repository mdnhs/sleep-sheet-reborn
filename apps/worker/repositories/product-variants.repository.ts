import { eq, and } from 'drizzle-orm'
import { productVariant } from '@repo/database/schema'
import type { Database, NewProductVariant } from '@repo/database'
import { generateId } from '../utils/id'

export function createProductVariantRepository(db: Database, organizationId: string) {
  const scope = eq(productVariant.organizationId, organizationId)

  return {
    findById(id: string) {
      return db.select().from(productVariant)
        .where(and(scope, eq(productVariant.id, id)))
        .then(r => r[0] ?? null)
    },

    findBySku(sku: string) {
      return db.select().from(productVariant)
        .where(and(scope, eq(productVariant.sku, sku)))
        .then(r => r[0] ?? null)
    },

    findByBarcode(barcode: string) {
      return db.select().from(productVariant)
        .where(and(scope, eq(productVariant.barcode, barcode)))
        .then(r => r[0] ?? null)
    },

    findByProduct(productId: string) {
      return db.select().from(productVariant)
        .where(and(scope, eq(productVariant.productId, productId)))
    },

    async create(data: Omit<NewProductVariant, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(productVariant).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewProductVariant, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>) {
      await db.update(productVariant)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(productVariant.id, id)))
      return this.findById(id)
    },

    async deactivate(id: string) {
      await db.update(productVariant)
        .set({ status: 'INACTIVE', updatedAt: new Date() })
        .where(and(scope, eq(productVariant.id, id)))
      return this.findById(id)
    },
  }
}

export type ProductVariantRepository = ReturnType<typeof createProductVariantRepository>
