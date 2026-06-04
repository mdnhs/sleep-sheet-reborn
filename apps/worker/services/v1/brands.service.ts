import type { Database } from '@repo/database'
import { createBrandRepository } from '../../repositories/brands.repository'
import { ServiceError } from '../../utils/service-error'

export function createBrandService(db: Database, organizationId: string) {
  const repo = createBrandRepository(db, organizationId)

  return {
    async list(includeInactive = false) {
      return repo.findMany(includeInactive)
    },

    async getById(id: string) {
      const brand = await repo.findById(id)
      if (!brand) throw new ServiceError('Brand not found', 404)
      return brand
    },

    async create(data: { name: string; slug: string }) {
      const existing = await repo.findBySlug(data.slug)
      if (existing) throw new ServiceError('Slug already in use', 409)
      return repo.create({ name: data.name, slug: data.slug, status: 'ACTIVE' })
    },

    async update(id: string, data: { name?: string; slug?: string }) {
      const brand = await repo.findById(id)
      if (!brand) throw new ServiceError('Brand not found', 404)

      if (data.slug && data.slug !== brand.slug) {
        const conflict = await repo.findBySlug(data.slug)
        if (conflict) throw new ServiceError('Slug already in use', 409)
      }

      return repo.update(id, data)
    },

    async archive(id: string) {
      const brand = await repo.findById(id)
      if (!brand) throw new ServiceError('Brand not found', 404)
      return repo.archive(id)
    },
  }
}
