import { eq, and, desc } from 'drizzle-orm'
import { customerGroup } from '@repo/database/schema'
import type { Database, NewCustomerGroup, CustomerGroup } from '@repo/database'
import { generateId } from '../utils/id'

export function createCustomerGroupsRepository(db: Database, organizationId: string) {
  const scope = eq(customerGroup.organizationId, organizationId)

  return {
    findMany(status?: CustomerGroup['status']) {
      const where = status ? and(scope, eq(customerGroup.status, status)) : scope
      return db.select().from(customerGroup).where(where).orderBy(desc(customerGroup.createdAt))
    },

    findById(id: string) {
      return db.select().from(customerGroup)
        .where(and(scope, eq(customerGroup.id, id)))
        .then(r => r[0] ?? null)
    },

    findByName(name: string) {
      return db.select().from(customerGroup)
        .where(and(scope, eq(customerGroup.name, name)))
        .then(r => r[0] ?? null)
    },

    async create(data: { name: string; discountPercent?: number }) {
      const now = new Date()
      const row: NewCustomerGroup = {
        id: generateId(), organizationId,
        name: data.name, discountPercent: data.discountPercent ?? 0,
        status: 'ACTIVE', createdAt: now, updatedAt: now,
      }
      await db.insert(customerGroup).values(row)
      return row
    },

    async update(id: string, data: Partial<Pick<CustomerGroup, 'name' | 'discountPercent' | 'status'>>) {
      await db.update(customerGroup)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(customerGroup.id, id)))
      return this.findById(id)
    },
  }
}

export type CustomerGroupsRepository = ReturnType<typeof createCustomerGroupsRepository>
