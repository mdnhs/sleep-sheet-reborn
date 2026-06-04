import type { Database } from '@repo/database'
import { createProductRepository, type ListProductsQuery } from '../../repositories/products.repository'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { enforceSubscriptionActive, enforceLimit } from '../../utils/plan-limits'
import { ServiceError } from '../../utils/service-error'

export function createProductService(db: Database, organizationId: string) {
  const repo = createProductRepository(db, organizationId)
  const variantRepo = createProductVariantRepository(db, organizationId)

  return {
    async list(query: ListProductsQuery = {}) {
      const [rows, total] = await Promise.all([repo.findMany(query), repo.count(query)])
      return { rows, total }
    },

    async getById(id: string) {
      const product = await repo.findById(id)
      if (!product) throw new ServiceError('Product not found', 404)
      const variants = await repo.findVariants(id)
      const images = await repo.findImages(id)
      return { ...product, variants, images }
    },

    async getBySlug(slug: string) {
      const product = await repo.findBySlug(slug)
      if (!product) throw new ServiceError('Product not found', 404)
      return product
    },

    async create(data: {
      name: string
      slug: string
      description?: string
      categoryId?: string
      brandId?: string
    }) {
      await enforceSubscriptionActive(db, organizationId)
      const currentCount = await repo.countByOrg()
      await enforceLimit(db, organizationId, 'limitProducts', currentCount)

      const existing = await repo.findBySlug(data.slug)
      if (existing) throw new ServiceError('Slug already in use within this organization', 409)

      return repo.create({ ...data, status: 'DRAFT' })
    },

    async update(id: string, data: {
      name?: string
      slug?: string
      description?: string | null
      categoryId?: string | null
      brandId?: string | null
      status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
    }) {
      const product = await repo.findById(id)
      if (!product) throw new ServiceError('Product not found', 404)

      if (data.slug && data.slug !== product.product.slug) {
        const conflict = await repo.findBySlug(data.slug)
        if (conflict) throw new ServiceError('Slug already in use within this organization', 409)
      }

      return repo.update(id, data)
    },

    async archive(id: string) {
      const product = await repo.findById(id)
      if (!product) throw new ServiceError('Product not found', 404)
      return repo.archive(id)
    },

    async listVariants(productId: string) {
      // Verify product belongs to this org
      const product = await repo.findById(productId)
      if (!product) throw new ServiceError('Product not found', 404)
      return variantRepo.findByProduct(productId)
    },
  }
}
