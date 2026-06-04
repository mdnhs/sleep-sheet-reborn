import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { productVariant } from './catalog'
import { location } from './locations'

export const supplier = sqliteTable('supplier', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('supplier_org_phone_idx').on(t.organizationId, t.phone),
  index('supplier_org_idx').on(t.organizationId),
])

export type Supplier = typeof supplier.$inferSelect
export type NewSupplier = typeof supplier.$inferInsert

export const supplierPayment = sqliteTable('supplier_payment', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  supplierId: text('supplierId').notNull().references(() => supplier.id, { onDelete: 'restrict' }),
  amount: integer('amount').notNull(), // stored in smallest unit (paisa)
  paymentMethod: text('paymentMethod', {
    enum: ['CASH', 'BANK', 'BKASH', 'NAGAD', 'CHEQUE'],
  }).notNull().default('CASH'),
  referenceNo: text('referenceNo'),
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('supplier_payment_org_idx').on(t.organizationId),
  index('supplier_payment_supplier_idx').on(t.supplierId),
])

export type SupplierPayment = typeof supplierPayment.$inferSelect
export type NewSupplierPayment = typeof supplierPayment.$inferInsert

export const purchaseOrder = sqliteTable('purchase_order', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  supplierId: text('supplierId').notNull().references(() => supplier.id, { onDelete: 'restrict' }),
  purchaseNumber: text('purchaseNumber').notNull(),
  status: text('status', {
    enum: ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED'],
  }).notNull().default('DRAFT'),
  receivingLocationId: text('receivingLocationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  subtotal: integer('subtotal').notNull().default(0),
  tax: integer('tax').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  grandTotal: integer('grandTotal').notNull().default(0),
  notes: text('notes'),
  approvedBy: text('approvedBy'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('purchase_order_org_number_idx').on(t.organizationId, t.purchaseNumber),
  index('purchase_order_org_idx').on(t.organizationId),
  index('purchase_order_supplier_idx').on(t.supplierId),
])

export type PurchaseOrder = typeof purchaseOrder.$inferSelect
export type NewPurchaseOrder = typeof purchaseOrder.$inferInsert

export const purchaseItem = sqliteTable('purchase_item', {
  id: text('id').primaryKey(),
  purchaseOrderId: text('purchaseOrderId').notNull().references(() => purchaseOrder.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  receivedQuantity: integer('receivedQuantity').notNull().default(0),
  unitCost: integer('unitCost').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('purchase_item_order_idx').on(t.purchaseOrderId),
])

export type PurchaseItem = typeof purchaseItem.$inferSelect
export type NewPurchaseItem = typeof purchaseItem.$inferInsert

export const purchaseReturn = sqliteTable('purchase_return', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  purchaseOrderId: text('purchaseOrderId').notNull().references(() => purchaseOrder.id, { onDelete: 'restrict' }),
  returnNumber: text('returnNumber').notNull(),
  status: text('status', {
    enum: ['PENDING', 'APPROVED', 'CANCELLED'],
  }).notNull().default('PENDING'),
  locationId: text('locationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  notes: text('notes'),
  approvedBy: text('approvedBy'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('purchase_return_org_number_idx').on(t.organizationId, t.returnNumber),
  index('purchase_return_org_idx').on(t.organizationId),
  index('purchase_return_po_idx').on(t.purchaseOrderId),
])

export type PurchaseReturn = typeof purchaseReturn.$inferSelect
export type NewPurchaseReturn = typeof purchaseReturn.$inferInsert

export const purchaseReturnItem = sqliteTable('purchase_return_item', {
  id: text('id').primaryKey(),
  purchaseReturnId: text('purchaseReturnId').notNull().references(() => purchaseReturn.id, { onDelete: 'cascade' }),
  purchaseItemId: text('purchaseItemId').notNull().references(() => purchaseItem.id, { onDelete: 'restrict' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitCost: integer('unitCost').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('purchase_return_item_return_idx').on(t.purchaseReturnId),
  index('purchase_return_item_purchase_item_idx').on(t.purchaseItemId),
])

export type PurchaseReturnItem = typeof purchaseReturnItem.$inferSelect
export type NewPurchaseReturnItem = typeof purchaseReturnItem.$inferInsert
