import { eq, and, sql } from 'drizzle-orm'
import { registerSession, posSale } from '@repo/database/schema'
import type { Database, NewRegisterSession } from '@repo/database'
import { generateId } from '../utils/id'

export function createRegisterSessionsRepository(db: Database, organizationId: string) {
  const scope = eq(registerSession.organizationId, organizationId)

  return {
    findMany(registerId?: string) {
      const where = registerId
        ? and(scope, eq(registerSession.cashRegisterId, registerId))
        : scope
      return db.select().from(registerSession).where(where)
        .orderBy(sql`${registerSession.openedAt} DESC`)
    },

    findById(id: string) {
      return db.select().from(registerSession)
        .where(and(scope, eq(registerSession.id, id)))
        .then(r => r[0] ?? null)
    },

    findOpenByRegister(registerId: string) {
      return db.select().from(registerSession)
        .where(and(scope, eq(registerSession.cashRegisterId, registerId), eq(registerSession.status, 'OPEN')))
        .then(r => r[0] ?? null)
    },

    async open(data: { cashRegisterId: string; openingCash: number; openedBy: string }) {
      const now = new Date()
      const row: NewRegisterSession = {
        id: generateId(),
        organizationId,
        cashRegisterId: data.cashRegisterId,
        openedBy: data.openedBy,
        closedBy: null,
        openingCash: data.openingCash,
        closingCash: null,
        status: 'OPEN',
        openedAt: now,
        closedAt: null,
      }
      await db.insert(registerSession).values(row)
      return row
    },

    async close(id: string, closingCash: number, closedBy: string) {
      const now = new Date()
      await db.update(registerSession)
        .set({ status: 'CLOSED', closingCash, closedBy, closedAt: now })
        .where(and(scope, eq(registerSession.id, id)))
      return this.findById(id)
    },

    async totalSalesBySession(sessionId: string): Promise<number> {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${posSale.grandTotal}), 0)` })
        .from(posSale)
        .where(and(
          eq(posSale.organizationId, organizationId),
          eq(posSale.sessionId, sessionId),
          eq(posSale.status, 'COMPLETED'),
        ))
      return result[0]?.total ?? 0
    },

    async countSalesBySession(sessionId: string): Promise<number> {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(posSale)
        .where(and(
          eq(posSale.organizationId, organizationId),
          eq(posSale.sessionId, sessionId),
          eq(posSale.status, 'COMPLETED'),
        ))
      return result[0]?.count ?? 0
    },
  }
}

export type RegisterSessionsRepository = ReturnType<typeof createRegisterSessionsRepository>
