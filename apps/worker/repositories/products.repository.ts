import { eq, and, like, count } from 'drizzle-orm'
import { product, productVariant, productImage, category, brand } from '@repo/database/schema'
import type { Database, NewProduct } from '@repo/database'
import { generateId } from '../utils/id'

export type ListProductsQuery = {
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  categoryId?: string
  brandId?: string
  search?: string
  limit?: number
  offset?: number
}

export function createProductRepository(db: Database, organizationId: string) {
  const scope = eq(product.organizationId, organizationId)

  return {
    async findMany(query: ListProductsQuery = {}) {
      const conditions = [scope]
      if (query.status) conditions.push(eq(product.status, query.status))
      if (query.categoryId) conditions.push(eq(product.categoryId, query.categoryId))
      if (query.brandId) conditions.push(eq(product.brandId, query.brandId))
      if (query.search) conditions.push(like(product.name, `%${query.search}%`))

      const where = and(...conditions)
      return db.select().from(product)
        .leftJoin(category, eq(product.categoryId, category.id))
        .leftJoin(brand, eq(product.brandId, brand.id))
        .where(where)
        .limit(query.limit ?? 20)
        .offset(query.offset ?? 0)
    },

    async count(query: ListProductsQuery = {}) {
      const conditions = [scope]
      if (query.status) conditions.push(eq(product.status, query.status))
      if (query.categoryId) conditions.push(eq(product.categoryId, query.categoryId))
      if (query.brandId) conditions.push(eq(product.brandId, query.brandId))
      if (query.search) conditions.push(like(product.name, `%${query.search}%`))

      const [row] = await db.select({ count: count() }).from(product).where(and(...conditions))
      return row?.count ?? 0
    },

    findById(id: string) {
      return db.select().from(product)
        .leftJoin(category, eq(product.categoryId, category.id))
        .leftJoin(brand, eq(product.brandId, brand.id))
        .where(and(scope, eq(product.id, id)))
        .then(r => r[0] ?? null)
    },

    findBySlug(slug: string) {
      return db.select().from(product).where(and(scope, eq(product.slug, slug))).then(r => r[0] ?? null)
    },

    findVariants(productId: string) {
      return db.select().from(productVariant)
        .where(and(eq(productVariant.organizationId, organizationId), eq(productVariant.productId, productId)))
    },

    findImages(productId: string) {
      return db.select().from(productImage)
        .where(and(eq(productImage.organizationId, organizationId), eq(productImage.productId, productId)))
        .orderBy(productImage.sortOrder)
    },

    async create(data: Omit<NewProduct, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(product).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewProduct, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>) {
      await db.update(product)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(product.id, id)))
      return db.select().from(product).where(and(scope, eq(product.id, id))).then(r => r[0] ?? null)
    },

    async archive(id: string) {
      await db.update(product)
        .set({ status: 'ARCHIVED', updatedAt: new Date() })
        .where(and(scope, eq(product.id, id)))
      return db.select().from(product).where(and(scope, eq(product.id, id))).then(r => r[0] ?? null)
    },

    countByOrg() {
      return db.select({ count: count() }).from(product)
        .where(and(scope, eq(product.status, 'ACTIVE')))
        .then(r => r[0]?.count ?? 0)
    },
  }
}

export type ProductRepository = ReturnType<typeof createProductRepository>
