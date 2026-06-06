import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

// ─── Notifications (org-scoped; userId null = organization-wide) ──────────────────

export const notification = sqliteTable('notification', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('userId'), // null = broadcast to the whole org
  type: text('type', { enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'] }).notNull().default('INFO'),
  title: text('title').notNull(),
  body: text('body'),
  // optional deep-link to a domain entity (e.g. order / shipment / invoice)
  entityType: text('entityType'),
  entityId: text('entityId'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('notification_org_idx').on(t.organizationId),
  index('notification_org_read_idx').on(t.organizationId, t.read),
  index('notification_org_user_idx').on(t.organizationId, t.userId),
])

export type Notification = typeof notification.$inferSelect
export type NewNotification = typeof notification.$inferInsert
