import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

// ─── Demo datasets (global catalog) ──────────────────────────────────────────────
// Curated sample data by business type. Organizations import these into their tenant;
// imported records are tracked so an import can be cleanly reverted.

export const demoDataset = sqliteTable('demo_dataset', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  businessType: text('businessType'),
  description: text('description'),
  payload: text('payload').notNull(), // JSON: { categories: [...], products: [...] }
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export type DemoDataset = typeof demoDataset.$inferSelect
export type NewDemoDataset = typeof demoDataset.$inferInsert

export const demoImport = sqliteTable('demo_import', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  datasetId: text('datasetId').notNull(),
  datasetName: text('datasetName'),
  status: text('status', { enum: ['COMPLETED', 'CLEARED'] }).notNull().default('COMPLETED'),
  categoryCount: integer('categoryCount').notNull().default(0),
  productCount: integer('productCount').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('demo_import_org_idx').on(t.organizationId),
])

export type DemoImport = typeof demoImport.$inferSelect
export type NewDemoImport = typeof demoImport.$inferInsert

// One row per created record, so clearing an import deletes exactly what it made.
export const demoImportItem = sqliteTable('demo_import_item', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  importId: text('importId').notNull().references(() => demoImport.id, { onDelete: 'cascade' }),
  entityType: text('entityType', { enum: ['category', 'product', 'product_variant'] }).notNull(),
  entityId: text('entityId').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('demo_import_item_import_idx').on(t.importId),
])

export type DemoImportItem = typeof demoImportItem.$inferSelect
export type NewDemoImportItem = typeof demoImportItem.$inferInsert
