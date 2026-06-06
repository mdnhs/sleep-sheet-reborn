import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

// ─── Customer Groups (segmentation: Regular / Silver / Gold / VIP / Wholesale) ───

export const customerGroup = sqliteTable('customer_group', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // default discount applied to members (basis points-free; whole percent 0-100)
  discountPercent: integer('discountPercent').notNull().default(0),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('customer_group_org_idx').on(t.organizationId),
  uniqueIndex('customer_group_org_name_idx').on(t.organizationId, t.name),
])

export type CustomerGroup = typeof customerGroup.$inferSelect
export type NewCustomerGroup = typeof customerGroup.$inferInsert

// ─── Customers ───────────────────────────────────────────────────────────────────
// Phone is unique per organization. Customers are never hard-deleted (archived only).
// walletBalance and loyaltyPoints are cached aggregates — only ever mutated by the
// service alongside an immutable wallet/loyalty transaction (see §34 of module doc).

export const customer = sqliteTable('customer', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  groupId: text('groupId').references(() => customerGroup.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  dateOfBirth: integer('dateOfBirth', { mode: 'timestamp' }),
  type: text('type', { enum: ['GUEST', 'REGISTERED', 'WHOLESALE', 'CORPORATE'] }).notNull().default('REGISTERED'),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED'] }).notNull().default('ACTIVE'),
  notes: text('notes'),
  walletBalance: integer('walletBalance').notNull().default(0),
  loyaltyPoints: integer('loyaltyPoints').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('customer_org_idx').on(t.organizationId),
  index('customer_org_status_idx').on(t.organizationId, t.status),
  uniqueIndex('customer_org_phone_idx').on(t.organizationId, t.phone),
])

export type Customer = typeof customer.$inferSelect
export type NewCustomer = typeof customer.$inferInsert

// ─── Customer Addresses (multiple billing / shipping per customer) ───────────────

export const customerAddress = sqliteTable('customer_address', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  customerId: text('customerId').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['BILLING', 'SHIPPING'] }).notNull().default('SHIPPING'),
  name: text('name'),
  phone: text('phone'),
  addressLine: text('addressLine').notNull(),
  area: text('area'),
  city: text('city'),
  postalCode: text('postalCode'),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('customer_address_org_idx').on(t.organizationId),
  index('customer_address_customer_idx').on(t.customerId),
])

export type CustomerAddress = typeof customerAddress.$inferSelect
export type NewCustomerAddress = typeof customerAddress.$inferInsert

// ─── Customer Wallet Transactions (immutable ledger; balance is derived) ─────────

export const customerWalletTransaction = sqliteTable('customer_wallet_transaction', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  customerId: text('customerId').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['CREDIT', 'DEBIT'] }).notNull(),
  amount: integer('amount').notNull(), // always positive
  balanceAfter: integer('balanceAfter').notNull(),
  source: text('source', { enum: ['REFUND', 'PROMO', 'MANUAL', 'ORDER', 'POS'] }).notNull().default('MANUAL'),
  referenceType: text('referenceType'),
  referenceId: text('referenceId'),
  note: text('note'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('customer_wallet_txn_org_idx').on(t.organizationId),
  index('customer_wallet_txn_customer_idx').on(t.customerId),
])

export type CustomerWalletTransaction = typeof customerWalletTransaction.$inferSelect
export type NewCustomerWalletTransaction = typeof customerWalletTransaction.$inferInsert

// ─── Customer Loyalty Transactions (immutable; EARN / REDEEM / REVERSE) ──────────

export const customerLoyaltyTransaction = sqliteTable('customer_loyalty_transaction', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  customerId: text('customerId').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['EARN', 'REDEEM', 'REVERSE'] }).notNull(),
  points: integer('points').notNull(), // always positive
  balanceAfter: integer('balanceAfter').notNull(),
  source: text('source', { enum: ['ORDER', 'POS', 'MANUAL', 'RETURN'] }).notNull().default('MANUAL'),
  referenceType: text('referenceType'),
  referenceId: text('referenceId'),
  note: text('note'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('customer_loyalty_txn_org_idx').on(t.organizationId),
  index('customer_loyalty_txn_customer_idx').on(t.customerId),
])

export type CustomerLoyaltyTransaction = typeof customerLoyaltyTransaction.$inferSelect
export type NewCustomerLoyaltyTransaction = typeof customerLoyaltyTransaction.$inferInsert
