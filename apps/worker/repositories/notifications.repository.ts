import { eq, and, or, isNull, desc, sql } from 'drizzle-orm'
import { notification } from '@repo/database/schema'
import type { Database, NewNotification, Notification } from '@repo/database'
import { generateId } from '../utils/id'

export function createNotificationsRepository(db: Database, organizationId: string) {
  const scope = eq(notification.organizationId, organizationId)

  // A user sees their own notifications plus org-wide broadcasts (userId IS NULL).
  function audience(userId?: string) {
    return userId ? or(isNull(notification.userId), eq(notification.userId, userId))! : isNull(notification.userId)
  }

  return {
    findMany(opts: { userId?: string; unreadOnly?: boolean; limit?: number } = {}) {
      const conds = [scope, audience(opts.userId)] as ReturnType<typeof eq>[]
      if (opts.unreadOnly) conds.push(eq(notification.read, false))
      return db.select().from(notification).where(and(...conds))
        .orderBy(desc(notification.createdAt)).limit(opts.limit ?? 50)
    },

    async unreadCount(userId?: string): Promise<number> {
      const r = await db.select({ n: sql<number>`COUNT(*)` }).from(notification)
        .where(and(scope, audience(userId), eq(notification.read, false)))
      return r[0]?.n ?? 0
    },

    findById(id: string) {
      return db.select().from(notification).where(and(scope, eq(notification.id, id))).then(r => r[0] ?? null)
    },

    async create(data: Omit<NewNotification, 'id' | 'organizationId' | 'createdAt' | 'read'> & { read?: boolean }) {
      const row: NewNotification = {
        id: generateId(), organizationId,
        userId: data.userId ?? null, type: data.type ?? 'INFO', title: data.title, body: data.body ?? null,
        entityType: data.entityType ?? null, entityId: data.entityId ?? null,
        read: data.read ?? false, createdAt: new Date(),
      }
      await db.insert(notification).values(row)
      return row
    },

    async markRead(id: string) {
      await db.update(notification).set({ read: true }).where(and(scope, eq(notification.id, id)))
      return this.findById(id)
    },

    /** Mark all of the user's notifications (and broadcasts) read. */
    async markAllRead(userId?: string) {
      await db.update(notification).set({ read: true })
        .where(and(scope, audience(userId), eq(notification.read, false)))
      return { ok: true }
    },
  }
}

export type NotificationsRepository = ReturnType<typeof createNotificationsRepository>
