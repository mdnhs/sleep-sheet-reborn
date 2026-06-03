import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

// Better Auth organization plugin uses modelName 'organization', 'member', 'invitation'
// Column names match Better Auth's expectations.

export const organization = sqliteTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'), // JSON — Better Auth org metadata field
  // Business fields (our additions)
  customDomain: text('customDomain').unique(),
  status: text('status', {
    enum: ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
  }).notNull().default('TRIAL'),
  currency: text('currency').notNull().default('BDT'),
  timezone: text('timezone').notNull().default('Asia/Dhaka'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export type Organization = typeof organization.$inferSelect
export type NewOrganization = typeof organization.$inferInsert

// Better Auth: modelName 'member'
export const member = sqliteTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', {
    enum: ['OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'CASHIER', 'DELIVERY_MANAGER', 'EMPLOYEE'],
  }).notNull().default('EMPLOYEE'),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }).notNull().default('ACTIVE'),
  invitedAt: integer('invitedAt', { mode: 'timestamp' }),
  joinedAt: integer('joinedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('member_org_user_idx').on(t.organizationId, t.userId),
])

export type Member = typeof member.$inferSelect
export type NewMember = typeof member.$inferInsert

// Better Auth: modelName 'invitation'
export const invitation = sqliteTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull(),
  status: text('status', {
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  }).notNull().default('PENDING'),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  inviterId: text('inviterId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
})
