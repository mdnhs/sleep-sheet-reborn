import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
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

export const subscriptionInvoice = sqliteTable('subscription_invoice', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscriptionId').notNull().references(() => subscription.id),
  provider: text('provider', { enum: ['bKash', 'Nagad', 'SSLCommerz'] }).notNull(),
  amount: integer('amount').notNull(),
  status: text('status', { enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] }).notNull().default('PENDING'),
  periodStart: integer('periodStart', { mode: 'timestamp' }),
  periodEnd: integer('periodEnd', { mode: 'timestamp' }),
  paidAt: integer('paidAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})
