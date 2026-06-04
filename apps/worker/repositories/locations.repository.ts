import { eq, and } from 'drizzle-orm'
import { branch, location } from '@repo/database/schema'
import type { Database, NewBranch, NewLocation } from '@repo/database'
import { generateId } from '../utils/id'

export function createLocationRepository(db: Database, organizationId: string) {
  const branchScope = eq(branch.organizationId, organizationId)
  const locationScope = eq(location.organizationId, organizationId)

  return {
    // Branches
    findBranches(includeInactive = false) {
      const where = includeInactive ? branchScope : and(branchScope, eq(branch.status, 'ACTIVE'))
      return db.select().from(branch).where(where)
    },

    findBranchById(id: string) {
      return db.select().from(branch).where(and(branchScope, eq(branch.id, id))).then(r => r[0] ?? null)
    },

    async createBranch(data: Omit<NewBranch, 'id' | 'organizationId'>) {
      const now = new Date()
      const row = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(branch).values(row)
      return row
    },

    async updateBranch(id: string, data: Partial<Omit<NewBranch, 'id' | 'organizationId'>>) {
      await db.update(branch)
        .set({ ...data, updatedAt: new Date() })
        .where(and(branchScope, eq(branch.id, id)))
      return this.findBranchById(id)
    },

    // Locations (Warehouses / Outlets)
    findLocations(type?: 'WAREHOUSE' | 'OUTLET', includeInactive = false) {
      const conditions = [locationScope]
      if (type) conditions.push(eq(location.type, type))
      if (!includeInactive) conditions.push(eq(location.status, 'ACTIVE'))
      return db.select().from(location).where(and(...conditions))
    },

    findLocationById(id: string) {
      return db.select().from(location).where(and(locationScope, eq(location.id, id))).then(r => r[0] ?? null)
    },

    findLocationByCode(code: string) {
      return db.select().from(location).where(and(locationScope, eq(location.code, code))).then(r => r[0] ?? null)
    },

    async createLocation(data: Omit<NewLocation, 'id' | 'organizationId'>) {
      const now = new Date()
      const row = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(location).values(row)
      return row
    },

    async updateLocation(id: string, data: Partial<Omit<NewLocation, 'id' | 'organizationId'>>) {
      await db.update(location)
        .set({ ...data, updatedAt: new Date() })
        .where(and(locationScope, eq(location.id, id)))
      return this.findLocationById(id)
    },

    countOutlets() {
      return db.select().from(location)
        .where(and(locationScope, eq(location.type, 'OUTLET'), eq(location.status, 'ACTIVE')))
        .then(r => r.length)
    },

    countWarehouses() {
      return db.select().from(location)
        .where(and(locationScope, eq(location.type, 'WAREHOUSE'), eq(location.status, 'ACTIVE')))
        .then(r => r.length)
    },
  }
}

export type LocationRepository = ReturnType<typeof createLocationRepository>
