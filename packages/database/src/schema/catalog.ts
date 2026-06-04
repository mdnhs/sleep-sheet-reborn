import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

export const category = sqliteTable('category', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  parentId: text('parentId'), // self-ref; no FK to avoid circular dep at schema level
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('category_org_slug_idx').on(t.organizationId, t.slug),
  index('category_org_idx').on(t.organizationId),
])

export type Category = typeof category.$inferSelect
export type NewCategory = typeof category.$inferInsert

export const brand = sqliteTable('brand', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('brand_org_slug_idx').on(t.organizationId, t.slug),
  index('brand_org_idx').on(t.organizationId),
])

export type Brand = typeof brand.$inferSelect
export type NewBrand = typeof brand.$inferInsert

export const unit = sqliteTable('unit', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  shortName: text('shortName').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('unit_org_idx').on(t.organizationId),
])

export type Unit = typeof unit.$inferSelect
export type NewUnit = typeof unit.$inferInsert

export const product = sqliteTable('product', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  categoryId: text('categoryId').references(() => category.id, { onDelete: 'set null' }),
  brandId: text('brandId').references(() => brand.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  status: text('status', { enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] }).notNull().default('DRAFT'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('product_org_slug_idx').on(t.organizationId, t.slug),
  index('product_org_idx').on(t.organizationId),
])

export type Product = typeof product.$inferSelect
export type NewProduct = typeof product.$inferInsert

export const productVariant = sqliteTable('product_variant', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  productId: text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  unitId: text('unitId').references(() => unit.id, { onDelete: 'set null' }),
  sku: text('sku').notNull(),
  barcode: text('barcode'),
  name: text('name').notNull(),
  costPrice: integer('costPrice').notNull().default(0),
  sellingPrice: integer('sellingPrice').notNull().default(0),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('product_variant_org_sku_idx').on(t.organizationId, t.sku),
  index('product_variant_org_idx').on(t.organizationId),
  index('product_variant_product_idx').on(t.productId),
])

export type ProductVariant = typeof productVariant.$inferSelect
export type NewProductVariant = typeof productVariant.$inferInsert

export const productImage = sqliteTable('product_image', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  productId: text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  cloudinaryPublicId: text('cloudinaryPublicId').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('product_image_org_idx').on(t.organizationId),
  index('product_image_product_idx').on(t.productId),
])

export type ProductImage = typeof productImage.$inferSelect
export type NewProductImage = typeof productImage.$inferInsert
