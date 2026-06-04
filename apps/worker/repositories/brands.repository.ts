import { eq, and } from 'drizzle-orm'
import { brand } from '@repo/database/schema'
import type { Database, NewBrand } from '@repo/database'
import { generateId } from '../utils/id'

export function createBrandRepository(db: Database, organizationId: string) {
  const scope = eq(brand.organizationId, organizationId)

  return {
    findMany(includeInactive = false) {
      const where = includeInactive ? scope : and(scope, eq(brand.status, 'ACTIVE'))
      return db.select().from(brand).where(where)
    },

    findById(id: string) {
      return db.select().from(brand).where(and(scope, eq(brand.id, id))).then(r => r[0] ?? null)
    },

    findBySlug(slug: string) {
      return db.select().from(brand).where(and(scope, eq(brand.slug, slug))).then(r => r[0] ?? null)
    },

    async create(data: Omit<NewBrand, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(brand).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewBrand, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>) {
      await db.update(brand)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(brand.id, id)))
      return this.findById(id)
    },

    async archive(id: string) {
      await db.update(brand)
        .set({ status: 'INACTIVE', updatedAt: new Date() })
        .where(and(scope, eq(brand.id, id)))
      return this.findById(id)
    },
  }
}

export type BrandRepository = ReturnType<typeof createBrandRepository>
