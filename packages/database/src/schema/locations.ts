import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

export const branch = sqliteTable('branch', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('branch_org_code_idx').on(t.organizationId, t.code),
  index('branch_org_idx').on(t.organizationId),
])

export type Branch = typeof branch.$inferSelect
export type NewBranch = typeof branch.$inferInsert

export const location = sqliteTable('location', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  branchId: text('branchId').references(() => branch.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  type: text('type', { enum: ['WAREHOUSE', 'OUTLET'] }).notNull(),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('location_org_code_idx').on(t.organizationId, t.code),
  index('location_org_idx').on(t.organizationId),
])

export type Location = typeof location.$inferSelect
export type NewLocation = typeof location.$inferInsert
