import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

export const subscriptionPlan = sqliteTable('subscription_plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  billingCycle: text('billingCycle', { enum: ['MONTHLY', 'YEARLY'] }).notNull(),
  price: integer('price').notNull().default(0),
  limitUsers: integer('limitUsers').notNull().default(5),
  limitOutlets: integer('limitOutlets').notNull().default(1),
  limitWarehouses: integer('limitWarehouses').notNull().default(1),
  limitProducts: integer('limitProducts').notNull().default(100),
  limitOrdersPerMonth: integer('limitOrdersPerMonth').notNull().default(500),
  limitThemes: integer('limitThemes').notNull().default(1),
  limitFunnels: integer('limitFunnels').notNull().default(3),
  featureFlags: text('featureFlags'), // JSON
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export type SubscriptionPlan = typeof subscriptionPlan.$inferSelect

export const subscription = sqliteTable('subscription', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().unique().references(() => organization.id, { onDelete: 'cascade' }),
  planId: text('planId').notNull().references(() => subscriptionPlan.id),
  status: text('status', {
    enum: ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
  }).notNull().default('TRIAL'),
  trialEndsAt: integer('trialEndsAt', { mode: 'timestamp' }),
  currentPeriodStart: integer('currentPeriodStart', { mode: 'timestamp' }),
  currentPeriodEnd: integer('currentPeriodEnd', { mode: 'timestamp' }),
  graceEndsAt: integer('graceEndsAt', { mode: 'timestamp' }),
  autoRenew: integer('autoRenew', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export type Subscription = typeof subscription.$inferSelect
export type NewSubscription = typeof subscription.$inferInsert
export type NewSubscriptionPlan = typeof subscriptionPlan.$inferInsert

export const subscriptionInvoice = sqliteTable('subscription_invoice', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscriptionId').notNull().references(() => subscription.id),
  planId: text('planId').references(() => subscriptionPlan.id),
  invoiceNumber: text('invoiceNumber'),
  provider: text('provider', { enum: ['bKash', 'Nagad', 'SSLCommerz', 'MANUAL'] }).notNull(),
  amount: integer('amount').notNull(),
  status: text('status', { enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] }).notNull().default('PENDING'),
  // provider transaction reference + idempotency key for verified webhooks
  providerRef: text('providerRef'),
  idempotencyKey: text('idempotencyKey'),
  periodStart: integer('periodStart', { mode: 'timestamp' }),
  periodEnd: integer('periodEnd', { mode: 'timestamp' }),
  paidAt: integer('paidAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('subscription_invoice_org_idx').on(t.organizationId),
  uniqueIndex('subscription_invoice_idempotency_idx').on(t.idempotencyKey),
])

export type SubscriptionInvoice = typeof subscriptionInvoice.$inferSelect
export type NewSubscriptionInvoice = typeof subscriptionInvoice.$inferInsert

// Per-organization feature flag overrides. Effective value falls back to the
// plan's featureFlags JSON when no override row exists.
export const featureFlag = sqliteTable('feature_flag', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  flag: text('flag').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('feature_flag_org_flag_idx').on(t.organizationId, t.flag),
])

export type FeatureFlag = typeof featureFlag.$inferSelect
export type NewFeatureFlag = typeof featureFlag.$inferInsert
