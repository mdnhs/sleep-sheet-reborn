import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { location } from './locations'
import { productVariant } from './catalog'

export const cashRegister = sqliteTable('cash_register', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  locationId: text('locationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('cash_register_org_idx').on(t.organizationId),
  index('cash_register_org_location_idx').on(t.organizationId, t.locationId),
])

export type CashRegister = typeof cashRegister.$inferSelect
export type NewCashRegister = typeof cashRegister.$inferInsert

export const registerSession = sqliteTable('register_session', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  cashRegisterId: text('cashRegisterId').notNull().references(() => cashRegister.id, { onDelete: 'restrict' }),
  openedBy: text('openedBy').notNull(),
  closedBy: text('closedBy'),
  openingCash: integer('openingCash').notNull(),
  closingCash: integer('closingCash'),
  status: text('status', { enum: ['OPEN', 'CLOSED'] }).notNull().default('OPEN'),
  openedAt: integer('openedAt', { mode: 'timestamp' }).notNull(),
  closedAt: integer('closedAt', { mode: 'timestamp' }),
}, (t) => [
  index('register_session_org_idx').on(t.organizationId),
  index('register_session_org_register_idx').on(t.organizationId, t.cashRegisterId),
])

export type RegisterSession = typeof registerSession.$inferSelect
export type NewRegisterSession = typeof registerSession.$inferInsert

export const posSale = sqliteTable('pos_sale', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  sessionId: text('sessionId').notNull().references(() => registerSession.id, { onDelete: 'restrict' }),
  locationId: text('locationId').notNull().references(() => location.id, { onDelete: 'restrict' }),
  customerId: text('customerId'),
  saleNumber: text('saleNumber').notNull(),
  status: text('status', { enum: ['DRAFT', 'COMPLETED', 'RETURNED', 'CANCELLED'] }).notNull().default('DRAFT'),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  tax: integer('tax').notNull().default(0),
  grandTotal: integer('grandTotal').notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('pos_sale_org_idx').on(t.organizationId),
  index('pos_sale_org_status_idx').on(t.organizationId, t.status),
  index('pos_sale_org_session_idx').on(t.organizationId, t.sessionId),
])

export type PosSale = typeof posSale.$inferSelect
export type NewPosSale = typeof posSale.$inferInsert

export const posSaleItem = sqliteTable('pos_sale_item', {
  id: text('id').primaryKey(),
  saleId: text('saleId').notNull().references(() => posSale.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unitPrice').notNull(),
  discount: integer('discount').notNull().default(0),
  lineTotal: integer('lineTotal').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('pos_sale_item_sale_idx').on(t.saleId),
])

export type PosSaleItem = typeof posSaleItem.$inferSelect
export type NewPosSaleItem = typeof posSaleItem.$inferInsert

export const posSalePayment = sqliteTable('pos_sale_payment', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  saleId: text('saleId').notNull().references(() => posSale.id, { onDelete: 'cascade' }),
  method: text('method', { enum: ['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK', 'WALLET'] }).notNull(),
  amount: integer('amount').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('pos_sale_payment_org_sale_idx').on(t.organizationId, t.saleId),
])

export type PosSalePayment = typeof posSalePayment.$inferSelect
export type NewPosSalePayment = typeof posSalePayment.$inferInsert

export const posSaleReturn = sqliteTable('pos_sale_return', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  saleId: text('saleId').notNull().references(() => posSale.id, { onDelete: 'restrict' }),
  returnNumber: text('returnNumber').notNull(),
  status: text('status', { enum: ['PENDING', 'APPROVED', 'CANCELLED'] }).notNull().default('PENDING'),
  notes: text('notes'),
  approvedBy: text('approvedBy'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('pos_sale_return_org_idx').on(t.organizationId),
  index('pos_sale_return_org_sale_idx').on(t.organizationId, t.saleId),
])

export type PosSaleReturn = typeof posSaleReturn.$inferSelect
export type NewPosSaleReturn = typeof posSaleReturn.$inferInsert

export const posSaleReturnItem = sqliteTable('pos_sale_return_item', {
  id: text('id').primaryKey(),
  returnId: text('returnId').notNull().references(() => posSaleReturn.id, { onDelete: 'cascade' }),
  saleItemId: text('saleItemId').notNull().references(() => posSaleItem.id, { onDelete: 'restrict' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('pos_sale_return_item_return_idx').on(t.returnId),
])

export type PosSaleReturnItem = typeof posSaleReturnItem.$inferSelect
export type NewPosSaleReturnItem = typeof posSaleReturnItem.$inferInsert
