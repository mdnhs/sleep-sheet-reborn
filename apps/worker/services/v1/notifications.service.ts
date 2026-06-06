import type { Database, Notification } from '@repo/database'
import { createNotificationsRepository } from '../../repositories/notifications.repository'
import { ServiceError } from '../../utils/service-error'

export function createNotificationsService(db: Database, organizationId: string) {
  const repo = createNotificationsRepository(db, organizationId)

  return {
    list(userId?: string, opts: { unreadOnly?: boolean; limit?: number } = {}) {
      return repo.findMany({ userId, ...opts })
    },

    async feed(userId?: string) {
      const [items, unread] = await Promise.all([repo.findMany({ userId, limit: 50 }), repo.unreadCount(userId)])
      return { items, unread }
    },

    async create(data: { title: string; body?: string; type?: Notification['type']; userId?: string; entityType?: string; entityId?: string }) {
      if (!data.title?.trim()) throw new ServiceError('Title is required', 400)
      return repo.create(data)
    },

    async markRead(id: string) {
      const n = await repo.findById(id)
      if (!n) throw new ServiceError('Notification not found', 404)
      return repo.markRead(id)
    },

    markAllRead(userId?: string) {
      return repo.markAllRead(userId)
    },
  }
}

export type NotificationsService = ReturnType<typeof createNotificationsService>
