import type { Database } from '@repo/database'
import { createUnitRepository } from '../../repositories/units.repository'
import { ServiceError } from '../../utils/service-error'

export function createUnitService(db: Database, organizationId: string) {
  const repo = createUnitRepository(db, organizationId)

  return {
    async list() {
      return repo.findMany()
    },

    async getById(id: string) {
      const unit = await repo.findById(id)
      if (!unit) throw new ServiceError('Unit not found', 404)
      return unit
    },

    async create(data: { name: string; shortName: string }) {
      return repo.create(data)
    },

    async update(id: string, data: { name?: string; shortName?: string }) {
      const unit = await repo.findById(id)
      if (!unit) throw new ServiceError('Unit not found', 404)
      return repo.update(id, data)
    },

    async delete(id: string) {
      const unit = await repo.findById(id)
      if (!unit) throw new ServiceError('Unit not found', 404)
      await repo.delete(id)
    },
  }
}
