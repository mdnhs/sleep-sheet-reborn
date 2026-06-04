import { eq, and } from 'drizzle-orm'
import { unit } from '@repo/database/schema'
import type { Database, NewUnit } from '@repo/database'
import { generateId } from '../utils/id'

export function createUnitRepository(db: Database, organizationId: string) {
  const scope = eq(unit.organizationId, organizationId)

  return {
    findMany() {
      return db.select().from(unit).where(scope)
    },

    findById(id: string) {
      return db.select().from(unit).where(and(scope, eq(unit.id, id))).then(r => r[0] ?? null)
    },

    async create(data: Omit<NewUnit, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(unit).values(row)
      return row
    },

    async update(id: string, data: Partial<Omit<NewUnit, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>) {
      await db.update(unit)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(unit.id, id)))
      return this.findById(id)
    },

    async delete(id: string) {
      await db.delete(unit).where(and(scope, eq(unit.id, id)))
    },
  }
}

export type UnitRepository = ReturnType<typeof createUnitRepository>
