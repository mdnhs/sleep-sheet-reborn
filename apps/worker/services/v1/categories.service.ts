import type { Database } from '@repo/database'
import { createCategoryRepository } from '../../repositories/categories.repository'
import { ServiceError } from '../../utils/service-error'

export function createCategoryService(db: Database, organizationId: string) {
  const repo = createCategoryRepository(db, organizationId)

  return {
    async list(includeInactive = false) {
      return repo.findMany(includeInactive)
    },

    async listRoots(includeInactive = false) {
      return repo.findRoots(includeInactive)
    },

    async getById(id: string) {
      const cat = await repo.findById(id)
      if (!cat) throw new ServiceError('Category not found', 404)
      return cat
    },

    async create(data: { name: string; slug: string; parentId?: string | null }) {
      const existing = await repo.findBySlug(data.slug)
      if (existing) throw new ServiceError('Slug already in use', 409)
      return repo.create({ name: data.name, slug: data.slug, parentId: data.parentId ?? null, status: 'ACTIVE' })
    },

    async update(id: string, data: { name?: string; slug?: string; parentId?: string | null }) {
      const cat = await repo.findById(id)
      if (!cat) throw new ServiceError('Category not found', 404)

      if (data.slug && data.slug !== cat.slug) {
        const conflict = await repo.findBySlug(data.slug)
        if (conflict) throw new ServiceError('Slug already in use', 409)
      }

      return repo.update(id, data)
    },

    async archive(id: string) {
      const cat = await repo.findById(id)
      if (!cat) throw new ServiceError('Category not found', 404)
      return repo.archive(id)
    },
  }
}
