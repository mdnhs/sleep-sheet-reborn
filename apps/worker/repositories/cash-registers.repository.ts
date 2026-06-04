import { eq, and } from 'drizzle-orm'
import { cashRegister } from '@repo/database/schema'
import type { Database, NewCashRegister } from '@repo/database'
import { generateId } from '../utils/id'

export function createCashRegistersRepository(db: Database, organizationId: string) {
  const scope = eq(cashRegister.organizationId, organizationId)

  return {
    findMany() {
      return db.select().from(cashRegister).where(scope)
    },

    findById(id: string) {
      return db.select().from(cashRegister)
        .where(and(scope, eq(cashRegister.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: { locationId: string; name: string }) {
      const now = new Date()
      const row: NewCashRegister = {
        id: generateId(),
        organizationId,
        locationId: data.locationId,
        name: data.name,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      }
      await db.insert(cashRegister).values(row)
      return row
    },

    async update(id: string, data: { name?: string; status?: 'ACTIVE' | 'INACTIVE' }) {
      await db.update(cashRegister)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(cashRegister.id, id)))
      return this.findById(id)
    },
  }
}

export type CashRegistersRepository = ReturnType<typeof createCashRegistersRepository>
