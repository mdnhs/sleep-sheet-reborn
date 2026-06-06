import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { order } from './orders'
import { location } from './locations'

// ─── Delivery Partners (couriers) ───────────────────────────────────────────────

export const deliveryPartner = sqliteTable('delivery_partner', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // bKash-style courier code, e.g. Pathao | RedX | SteadFast | Paperfly | Sundarban | INTERNAL
  code: text('code'),
  phone: text('phone'),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('delivery_partner_org_idx').on(t.organizationId),
])

export type DeliveryPartner = typeof deliveryPartner.$inferSelect
export type NewDeliveryPartner = typeof deliveryPartner.$inferInsert

// ─── Riders ─────────────────────────────────────────────────────────────────────

export const rider = sqliteTable('rider', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  status: text('status', { enum: ['AVAILABLE', 'BUSY', 'INACTIVE'] }).notNull().default('AVAILABLE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('rider_org_idx').on(t.organizationId),
])

export type Rider = typeof rider.$inferSelect
export type NewRider = typeof rider.$inferInsert

// ─── Shipments ──────────────────────────────────────────────────────────────────

export const shipment = sqliteTable('shipment', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'restrict' }),
  trackingNumber: text('trackingNumber').notNull(),
  deliveryPartnerId: text('deliveryPartnerId').references(() => deliveryPartner.id, { onDelete: 'set null' }),
  riderId: text('riderId').references(() => rider.id, { onDelete: 'set null' }),
  originLocationId: text('originLocationId').references(() => location.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED'],
  }).notNull().default('CREATED'),
  // free-form status reported by the external courier sync
  courierStatus: text('courierStatus'),
  codAmount: integer('codAmount').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('shipment_org_idx').on(t.organizationId),
  index('shipment_org_status_idx').on(t.organizationId, t.status),
  index('shipment_org_order_idx').on(t.organizationId, t.orderId),
  uniqueIndex('shipment_org_tracking_idx').on(t.organizationId, t.trackingNumber),
])

export type Shipment = typeof shipment.$inferSelect
export type NewShipment = typeof shipment.$inferInsert

// ─── Shipment Events (immutable tracking history) ────────────────────────────────

export const shipmentEvent = sqliteTable('shipment_event', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  shipmentId: text('shipmentId').notNull().references(() => shipment.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  note: text('note'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('shipment_event_org_idx').on(t.organizationId),
  index('shipment_event_shipment_idx').on(t.shipmentId),
])

export type ShipmentEvent = typeof shipmentEvent.$inferSelect
export type NewShipmentEvent = typeof shipmentEvent.$inferInsert
