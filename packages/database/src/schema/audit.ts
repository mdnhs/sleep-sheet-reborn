import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  entityType: text('entityType').notNull(), // 'product' | 'brand' | 'category' | 'inventory' | ...
  entityId: text('entityId').notNull(),
  action: text('action').notNull(),        // 'create' | 'update' | 'archive' | 'delete'
  actorId: text('actorId'),               // user.id; null = system action
  changes: text('changes'),               // JSON snapshot of mutated fields
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('audit_log_org_idx').on(t.organizationId),
  index('audit_log_entity_idx').on(t.organizationId, t.entityType, t.entityId),
])

export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert
