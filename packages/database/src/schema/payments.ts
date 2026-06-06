import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { order } from './orders'

// ─── Order payments (storefront online payments) ─────────────────────────────────
// One payment attempt per provider transaction. Verified, idempotent webhooks mark
// it PAID; the parent order's paymentStatus mirrors the outcome.

export const orderPayment = sqliteTable('order_payment', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['bKash', 'Nagad', 'SSLCommerz', 'MANUAL'] }).notNull(),
  amount: integer('amount').notNull(),
  status: text('status', { enum: ['PENDING', 'PAID', 'FAILED'] }).notNull().default('PENDING'),
  providerRef: text('providerRef'),
  idempotencyKey: text('idempotencyKey'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('order_payment_org_idx').on(t.organizationId),
  index('order_payment_order_idx').on(t.orderId),
  uniqueIndex('order_payment_idempotency_idx').on(t.idempotencyKey),
])

export type OrderPayment = typeof orderPayment.$inferSelect
export type NewOrderPayment = typeof orderPayment.$inferInsert
