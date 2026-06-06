import { eq, and } from 'drizzle-orm'
import { rider } from '@repo/database/schema'
import type { Database, NewRider, Rider } from '@repo/database'
import { generateId } from '../utils/id'

export function createRidersRepository(db: Database, organizationId: string) {
  const scope = eq(rider.organizationId, organizationId)

  return {
    findMany(status?: Rider['status']) {
      const conditions = [scope] as ReturnType<typeof eq>[]
      if (status) conditions.push(eq(rider.status, status))
      return db.select().from(rider).where(and(...conditions)).orderBy(rider.name)
    },

    findById(id: string) {
      return db.select().from(rider)
        .where(and(scope, eq(rider.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: { name: string; phone: string }) {
      const now = new Date()
      const row: NewRider = {
        id: generateId(), organizationId,
        name: data.name, phone: data.phone, status: 'AVAILABLE',
        createdAt: now, updatedAt: now,
      }
      await db.insert(rider).values(row)
      return row
    },

    async update(id: string, data: Partial<Pick<Rider, 'name' | 'phone' | 'status'>>) {
      await db.update(rider)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(rider.id, id)))
      return this.findById(id)
    },
  }
}

export type RidersRepository = ReturnType<typeof createRidersRepository>
