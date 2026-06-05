import { eq, and } from 'drizzle-orm'
import { deliveryPartner } from '@repo/database/schema'
import type { Database, NewDeliveryPartner, DeliveryPartner } from '@repo/database'
import { generateId } from '../utils/id'

export function createDeliveryPartnersRepository(db: Database, organizationId: string) {
  const scope = eq(deliveryPartner.organizationId, organizationId)

  return {
    findMany(status?: DeliveryPartner['status']) {
      const conditions = [scope] as ReturnType<typeof eq>[]
      if (status) conditions.push(eq(deliveryPartner.status, status))
      return db.select().from(deliveryPartner).where(and(...conditions)).orderBy(deliveryPartner.name)
    },

    findById(id: string) {
      return db.select().from(deliveryPartner)
        .where(and(scope, eq(deliveryPartner.id, id)))
        .then(r => r[0] ?? null)
    },

    async create(data: { name: string; code?: string | null; phone?: string | null }) {
      const now = new Date()
      const row: NewDeliveryPartner = {
        id: generateId(), organizationId,
        name: data.name, code: data.code ?? null, phone: data.phone ?? null,
        status: 'ACTIVE', createdAt: now, updatedAt: now,
      }
      await db.insert(deliveryPartner).values(row)
      return row
    },

    async update(id: string, data: Partial<Pick<DeliveryPartner, 'name' | 'code' | 'phone' | 'status'>>) {
      await db.update(deliveryPartner)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(deliveryPartner.id, id)))
      return this.findById(id)
    },
  }
}

export type DeliveryPartnersRepository = ReturnType<typeof createDeliveryPartnersRepository>
