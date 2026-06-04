import { eq, and, isNull } from 'drizzle-orm'
import { category } from '@repo/database/schema'
import type { Database, NewCategory } from '@repo/database'
import { generateId } from '../utils/id'

export function createCategoryRepository(db: Database, organizationId: string) {
  const scope = eq(category.organizationId, organizationId)

  return {
    findMany(includeInactive = false) {
      const where = includeInactive ? scope : and(scope, eq(category.status, 'ACTIVE'))
      return db.select().from(category).where(where)
    },

    findRoots(includeInactive = false) {
      const where = includeInactive
        ? and(scope, isNull(category.parentId))
        : and(scope, isNull(category.parentId), eq(category.status, 'ACTIVE'))
      return db.select().from(category).where(where)
    },

    findChildren(parentId: string) {
      return db.select().from(category).where(and(scope, eq(category.parentId, parentId)))
    },

    findById(id: string) {
      return db.select().from(category).where(and(scope, eq(category.id, id))).then(r => r[0] ?? null)
    },

    findBySlug(slug: string) {
      return db.select().from(category).where(and(scope, eq(category.slug, slug))).then(r => r[0] ?? null)
    },

    async create(data: Omit<NewCategory, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(category).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewCategory, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>) {
      await db.update(category)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(category.id, id)))
      return this.findById(id)
    },

    async archive(id: string) {
      await db.update(category)
        .set({ status: 'INACTIVE', updatedAt: new Date() })
        .where(and(scope, eq(category.id, id)))
      return this.findById(id)
    },

    async hasProducts(id: string): Promise<boolean> {
      // checked at service layer via product repo; kept here as a signal
      return false
    },
  }
}

export type CategoryRepository = ReturnType<typeof createCategoryRepository>
