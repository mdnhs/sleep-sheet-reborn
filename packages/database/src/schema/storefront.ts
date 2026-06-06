import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'

// ─── Themes (global catalog) ─────────────────────────────────────────────────────
// Themes control UI only — never ERP logic. Bundles live in R2 (theme_version.r2Key);
// D1 stores metadata + keys only (ADR-014, ADR-024).

export const theme = sqliteTable('theme', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: text('type', { enum: ['FREE', 'PREMIUM'] }).notNull().default('FREE'),
  category: text('category'), // Grocery | Fashion | Electronics | Pharmacy | Restaurant
  price: integer('price').notNull().default(0),
  previewImage: text('previewImage'),
  description: text('description'),
  author: text('author'),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  uniqueIndex('theme_slug_idx').on(t.slug),
])

export type Theme = typeof theme.$inferSelect
export type NewTheme = typeof theme.$inferInsert

export const themeVersion = sqliteTable('theme_version', {
  id: text('id').primaryKey(),
  themeId: text('themeId').notNull().references(() => theme.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  r2Key: text('r2Key'),
  releaseNotes: text('releaseNotes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('theme_version_theme_idx').on(t.themeId),
])

export type ThemeVersion = typeof themeVersion.$inferSelect
export type NewThemeVersion = typeof themeVersion.$inferInsert

// ─── Organization theme (one active per org) ─────────────────────────────────────
// config JSON holds theme settings: logo, favicon, primary/secondary colors,
// typography, head/body/footer custom scripts.

export const organizationTheme = sqliteTable('organization_theme', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  themeId: text('themeId').notNull().references(() => theme.id, { onDelete: 'restrict' }),
  version: text('version'),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
  config: text('config'), // JSON
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('organization_theme_org_idx').on(t.organizationId),
  uniqueIndex('organization_theme_org_theme_idx').on(t.organizationId, t.themeId),
])

export type OrganizationTheme = typeof organizationTheme.$inferSelect
export type NewOrganizationTheme = typeof organizationTheme.$inferInsert

// ─── Pages (CMS) ─────────────────────────────────────────────────────────────────

export const page = sqliteTable('page', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: text('content'),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED'] }).notNull().default('DRAFT'),
  metaTitle: text('metaTitle'),
  metaDescription: text('metaDescription'),
  ogImage: text('ogImage'),
  canonicalUrl: text('canonicalUrl'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('page_org_idx').on(t.organizationId),
  uniqueIndex('page_org_slug_idx').on(t.organizationId, t.slug),
])

export type Page = typeof page.$inferSelect
export type NewPage = typeof page.$inferInsert

// ─── Blog posts ──────────────────────────────────────────────────────────────────

export const blogPost = sqliteTable('blog_post', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  coverImage: text('coverImage'),
  category: text('category'),
  tags: text('tags'), // comma-separated
  status: text('status', { enum: ['DRAFT', 'PUBLISHED'] }).notNull().default('DRAFT'),
  publishedAt: integer('publishedAt', { mode: 'timestamp' }),
  metaTitle: text('metaTitle'),
  metaDescription: text('metaDescription'),
  ogImage: text('ogImage'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('blog_post_org_idx').on(t.organizationId),
  index('blog_post_org_status_idx').on(t.organizationId, t.status),
  uniqueIndex('blog_post_org_slug_idx').on(t.organizationId, t.slug),
])

export type BlogPost = typeof blogPost.$inferSelect
export type NewBlogPost = typeof blogPost.$inferInsert

// ─── Menus (header / footer / mobile; nested items as JSON) ───────────────────────

export const menu = sqliteTable('menu', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  location: text('location', { enum: ['HEADER', 'FOOTER', 'MOBILE'] }).notNull(),
  name: text('name').notNull(),
  items: text('items'), // JSON: [{ label, url, external, children: [...] }]
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('menu_org_idx').on(t.organizationId),
  uniqueIndex('menu_org_location_idx').on(t.organizationId, t.location),
])

export type Menu = typeof menu.$inferSelect
export type NewMenu = typeof menu.$inferInsert

// ─── Redirects (301 / 302) ───────────────────────────────────────────────────────

export const redirect = sqliteTable('redirect', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  fromPath: text('fromPath').notNull(),
  toPath: text('toPath').notNull(),
  type: text('type', { enum: ['301', '302'] }).notNull().default('301'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('redirect_org_idx').on(t.organizationId),
  uniqueIndex('redirect_org_from_idx').on(t.organizationId, t.fromPath),
])

export type Redirect = typeof redirect.$inferSelect
export type NewRedirect = typeof redirect.$inferInsert

// ─── Homepage sections (section-based homepage builder) ──────────────────────────

export const homepageSection = sqliteTable('homepage_section', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['HERO', 'CATEGORY_GRID', 'FEATURED_PRODUCTS', 'FLASH_SALE', 'BEST_SELLERS', 'TESTIMONIALS', 'BLOG_POSTS', 'BANNER', 'CUSTOM_HTML'],
  }).notNull(),
  position: integer('position').notNull().default(0),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  config: text('config'), // JSON: section-specific blocks (title, subtitle, image, button, …)
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('homepage_section_org_idx').on(t.organizationId),
])

export type HomepageSection = typeof homepageSection.$inferSelect
export type NewHomepageSection = typeof homepageSection.$inferInsert
