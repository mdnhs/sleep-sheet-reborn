import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

export const finAccount = sqliteTable('fin_account', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['CASH', 'BANK', 'MOBILE_BANKING', 'DIGITAL_WALLET'] }).notNull(),
  openingBalance: integer('openingBalance').notNull().default(0),
  currentBalance: integer('currentBalance').notNull().default(0),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('fin_account_org_idx').on(t.organizationId),
])

export type FinAccount = typeof finAccount.$inferSelect
export type NewFinAccount = typeof finAccount.$inferInsert

export const finTransaction = sqliteTable('fin_transaction', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull().references(() => finAccount.id, { onDelete: 'restrict' }),
  type: text('type', {
    enum: ['SALE', 'PURCHASE_PAYMENT', 'CUSTOMER_PAYMENT', 'REFUND', 'EXPENSE', 'WALLET_CREDIT', 'WALLET_DEBIT', 'ADJUSTMENT'],
  }).notNull(),
  // positive = credit (money in), negative = debit (money out)
  amount: integer('amount').notNull(),
  referenceType: text('referenceType'),
  referenceId: text('referenceId'),
  note: text('note'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('fin_transaction_org_idx').on(t.organizationId),
  index('fin_transaction_org_account_idx').on(t.organizationId, t.accountId),
  index('fin_transaction_org_type_idx').on(t.organizationId, t.type),
])

export type FinTransaction = typeof finTransaction.$inferSelect
export type NewFinTransaction = typeof finTransaction.$inferInsert

export const finExpense = sqliteTable('fin_expense', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  category: text('category', {
    enum: ['RENT', 'SALARY', 'UTILITY', 'TRANSPORTATION', 'MARKETING', 'MISCELLANEOUS', 'OTHER'],
  }).notNull(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  accountId: text('accountId').references(() => finAccount.id, { onDelete: 'restrict' }),
  status: text('status', { enum: ['PENDING', 'APPROVED', 'REJECTED'] }).notNull().default('PENDING'),
  approvedBy: text('approvedBy'),
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('fin_expense_org_idx').on(t.organizationId),
  index('fin_expense_org_status_idx').on(t.organizationId, t.status),
])

export type FinExpense = typeof finExpense.$inferSelect
export type NewFinExpense = typeof finExpense.$inferInsert
