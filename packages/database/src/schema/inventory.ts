import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { productVariant } from './catalog'
import { location } from './locations'

export const inventory = sqliteTable('inventory', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'cascade' }),
  locationId: text('locationId').notNull().references(() => location.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('inventory_org_variant_location_idx').on(t.organizationId, t.variantId, t.locationId),
  index('inventory_org_idx').on(t.organizationId),
])

export type Inventory = typeof inventory.$inferSelect
export type NewInventory = typeof inventory.$inferInsert

export const inventoryMovement = sqliteTable('inventory_movement', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  locationId: text('locationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  movementType: text('movementType', {
    enum: ['PURCHASE', 'POS_SALE', 'ONLINE_SALE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'DAMAGE', 'EXPIRED', 'ADJUSTMENT'],
  }).notNull(),
  quantity: integer('quantity').notNull(),
  referenceType: text('referenceType'),
  referenceId: text('referenceId'),
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('inventory_movement_org_idx').on(t.organizationId),
  index('inventory_movement_variant_idx').on(t.variantId),
])

export type InventoryMovement = typeof inventoryMovement.$inferSelect
export type NewInventoryMovement = typeof inventoryMovement.$inferInsert

export const transfer = sqliteTable('transfer', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  fromLocationId: text('fromLocationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  toLocationId: text('toLocationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  status: text('status', {
    enum: ['DRAFT', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'],
  }).notNull().default('DRAFT'),
  approvedBy: text('approvedBy'),
  receivedBy: text('receivedBy'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('transfer_org_idx').on(t.organizationId),
])

export type Transfer = typeof transfer.$inferSelect
export type NewTransfer = typeof transfer.$inferInsert

export const transferItem = sqliteTable('transfer_item', {
  id: text('id').primaryKey(),
  transferId: text('transferId').notNull().references(() => transfer.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

export type TransferItem = typeof transferItem.$inferSelect
export type NewTransferItem = typeof transferItem.$inferInsert
