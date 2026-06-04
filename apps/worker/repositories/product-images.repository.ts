import { eq, and } from 'drizzle-orm'
import { productImage } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { generateId } from '../utils/id'

export function createProductImageRepository(db: Database, organizationId: string) {
  const scope = eq(productImage.organizationId, organizationId)

  return {
    findByProduct(productId: string) {
      return db.select().from(productImage)
        .where(and(scope, eq(productImage.productId, productId)))
        .orderBy(productImage.sortOrder)
    },

    findById(id: string) {
      return db.select().from(productImage)
        .where(and(scope, eq(productImage.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: { productId: string; cloudinaryPublicId: string; url: string; sortOrder?: number }) {
      const now = new Date()
      const row = {
        id: generateId(),
        organizationId,
        productId: data.productId,
        cloudinaryPublicId: data.cloudinaryPublicId,
        url: data.url,
        sortOrder: data.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      }
      await db.insert(productImage).values(row)
      return row
    },

    async delete(id: string) {
      const existing = await this.findById(id)
      await db.delete(productImage).where(and(scope, eq(productImage.id, id)))
      return existing
    },

    async reorder(productId: string, orderedIds: string[]) {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(productImage)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(and(scope, eq(productImage.id, orderedIds[i]!), eq(productImage.productId, productId)))
      }
    },
  }
}

export type ProductImageRepository = ReturnType<typeof createProductImageRepository>
