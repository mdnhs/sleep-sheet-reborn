import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { productVariant } from './catalog'
import { location } from './locations'

export const order = sqliteTable('order', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  customerId: text('customerId'),
  fulfillmentLocationId: text('fulfillmentLocationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  orderNumber: text('orderNumber').notNull(),
  source: text('source', {
    enum: ['POS', 'WEBSITE', 'FUNNEL', 'MANUAL', 'API'],
  }).notNull().default('MANUAL'),
  status: text('status', {
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  }).notNull().default('PENDING'),
  paymentStatus: text('paymentStatus', {
    enum: ['PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'],
  }).notNull().default('PENDING'),
  paymentMethod: text('paymentMethod', {
    enum: ['COD', 'BKASH', 'NAGAD', 'SSLCOMMERZ', 'BANK', 'WALLET'],
  }),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  tax: integer('tax').notNull().default(0),
  shippingCost: integer('shippingCost').notNull().default(0),
  grandTotal: integer('grandTotal').notNull(),
  notes: text('notes'),
  customerNotes: text('customerNotes'),
  campaignId: text('campaignId'),
  funnelId: text('funnelId'),
  utmSource: text('utmSource'),
  utmMedium: text('utmMedium'),
  utmCampaign: text('utmCampaign'),
  deliveredAt: integer('deliveredAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('order_org_number_idx').on(t.organizationId, t.orderNumber),
  index('order_org_idx').on(t.organizationId),
  index('order_org_status_idx').on(t.organizationId, t.status),
])

export type Order = typeof order.$inferSelect
export type NewOrder = typeof order.$inferInsert

export const orderItem = sqliteTable('order_item', {
  id: text('id').primaryKey(),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unitPrice').notNull(),
  discount: integer('discount').notNull().default(0),
  lineTotal: integer('lineTotal').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('order_item_order_idx').on(t.orderId),
])

export type OrderItem = typeof orderItem.$inferSelect
export type NewOrderItem = typeof orderItem.$inferInsert

export const orderAddress = sqliteTable('order_address', {
  id: text('id').primaryKey(),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  area: text('area'),
  city: text('city').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

export type OrderAddress = typeof orderAddress.$inferSelect
export type NewOrderAddress = typeof orderAddress.$inferInsert

export const orderTimeline = sqliteTable('order_timeline', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  note: text('note'),
  actorId: text('actorId'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('order_timeline_org_order_idx').on(t.organizationId, t.orderId),
])

export type OrderTimeline = typeof orderTimeline.$inferSelect
export type NewOrderTimeline = typeof orderTimeline.$inferInsert

export const inventoryReservation = sqliteTable('inventory_reservation', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  locationId: text('locationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  status: text('status', {
    enum: ['RESERVED', 'CONSUMED', 'RELEASED', 'EXPIRED'],
  }).notNull().default('RESERVED'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('inventory_reservation_org_order_idx').on(t.organizationId, t.orderId),
  index('inventory_reservation_org_variant_loc_idx').on(t.organizationId, t.variantId, t.locationId),
])

export type InventoryReservation = typeof inventoryReservation.$inferSelect
export type NewInventoryReservation = typeof inventoryReservation.$inferInsert

export const orderRefund = sqliteTable('order_refund', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'restrict' }),
  amount: integer('amount').notNull(),
  reason: text('reason'),
  status: text('status', {
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  }).notNull().default('PENDING'),
  method: text('method', {
    enum: ['ORIGINAL', 'WALLET', 'MANUAL'],
  }).notNull().default('MANUAL'),
  approvedBy: text('approvedBy'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('order_refund_org_order_idx').on(t.organizationId, t.orderId),
])

export type OrderRefund = typeof orderRefund.$inferSelect
export type NewOrderRefund = typeof orderRefund.$inferInsert

export const orderReturn = sqliteTable('order_return', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'restrict' }),
  returnNumber: text('returnNumber').notNull(),
  status: text('status', {
    enum: ['PENDING', 'APPROVED', 'CANCELLED'],
  }).notNull().default('PENDING'),
  notes: text('notes'),
  approvedBy: text('approvedBy'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('order_return_org_number_idx').on(t.organizationId, t.returnNumber),
  index('order_return_org_order_idx').on(t.organizationId, t.orderId),
])

export type OrderReturn = typeof orderReturn.$inferSelect
export type NewOrderReturn = typeof orderReturn.$inferInsert

export const orderReturnItem = sqliteTable('order_return_item', {
  id: text('id').primaryKey(),
  orderReturnId: text('orderReturnId').notNull().references(() => orderReturn.id, { onDelete: 'cascade' }),
  orderItemId: text('orderItemId').notNull().references(() => orderItem.id, { onDelete: 'restrict' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('order_return_item_return_idx').on(t.orderReturnId),
])

export type OrderReturnItem = typeof orderReturnItem.$inferSelect
export type NewOrderReturnItem = typeof orderReturnItem.$inferInsert
