import type { Database } from '@repo/database'
import { createLocationRepository } from '../../repositories/locations.repository'
import { enforceSubscriptionActive, enforceLimit } from '../../utils/plan-limits'
import { ServiceError } from '../../utils/service-error'

export function createLocationService(db: Database, organizationId: string) {
  const repo = createLocationRepository(db, organizationId)

  return {
    // ── Branches ─────────────────────────────────────────────────────────────

    async listBranches(includeInactive = false) {
      return repo.findBranches(includeInactive)
    },

    async getBranchById(id: string) {
      const branch = await repo.findBranchById(id)
      if (!branch) throw new ServiceError('Branch not found', 404)
      return branch
    },

    async createBranch(data: { name: string; code: string; phone?: string; email?: string; address?: string }) {
      return repo.createBranch({ ...data, status: 'ACTIVE' })
    },

    async updateBranch(id: string, data: { name?: string; code?: string; phone?: string; email?: string; address?: string; status?: 'ACTIVE' | 'INACTIVE' }) {
      const branch = await repo.findBranchById(id)
      if (!branch) throw new ServiceError('Branch not found', 404)
      return repo.updateBranch(id, data)
    },

    // ── Locations (Warehouses / Outlets) ─────────────────────────────────────

    async listLocations(type?: 'WAREHOUSE' | 'OUTLET', includeInactive = false) {
      return repo.findLocations(type, includeInactive)
    },

    async getLocationById(id: string) {
      const loc = await repo.findLocationById(id)
      if (!loc) throw new ServiceError('Location not found', 404)
      return loc
    },

    async createWarehouse(data: { name: string; code: string; branchId?: string }) {
      await enforceSubscriptionActive(db, organizationId)
      const current = await repo.countWarehouses()
      await enforceLimit(db, organizationId, 'limitWarehouses', current)

      const conflict = await repo.findLocationByCode(data.code)
      if (conflict) throw new ServiceError('Location code already in use', 409)

      return repo.createLocation({ ...data, type: 'WAREHOUSE', status: 'ACTIVE', branchId: data.branchId ?? null })
    },

    async createOutlet(data: { name: string; code: string; branchId?: string }) {
      await enforceSubscriptionActive(db, organizationId)
      const current = await repo.countOutlets()
      await enforceLimit(db, organizationId, 'limitOutlets', current)

      const conflict = await repo.findLocationByCode(data.code)
      if (conflict) throw new ServiceError('Location code already in use', 409)

      return repo.createLocation({ ...data, type: 'OUTLET', status: 'ACTIVE', branchId: data.branchId ?? null })
    },

    async updateLocation(id: string, data: { name?: string; code?: string; branchId?: string | null; status?: 'ACTIVE' | 'INACTIVE' }) {
      const loc = await repo.findLocationById(id)
      if (!loc) throw new ServiceError('Location not found', 404)

      if (data.code && data.code !== loc.code) {
        const conflict = await repo.findLocationByCode(data.code)
        if (conflict) throw new ServiceError('Location code already in use', 409)
      }

      return repo.updateLocation(id, data)
    },
  }
}
