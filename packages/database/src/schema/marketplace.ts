import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { theme } from './storefront'
import { funnelTemplate, funnel } from './growth'

// ─── Marketplace ownership (org-scoped) ──────────────────────────────────────────
// Catalogs (theme, funnel_template) are global; ownership is per organization.
// Installing never mutates ERP — themes affect UI, funnels affect conversion.

export const themePurchase = sqliteTable('theme_purchase', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  themeId: text('themeId').notNull().references(() => theme.id, { onDelete: 'cascade' }),
  license: text('license', { enum: ['PER_ORG'] }).notNull().default('PER_ORG'),
  pricePaid: integer('pricePaid').notNull().default(0),
  purchasedAt: integer('purchasedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('theme_purchase_org_idx').on(t.organizationId),
  uniqueIndex('theme_purchase_org_theme_idx').on(t.organizationId, t.themeId),
])

export type ThemePurchase = typeof themePurchase.$inferSelect
export type NewThemePurchase = typeof themePurchase.$inferInsert

export const funnelPurchase = sqliteTable('funnel_purchase', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  funnelTemplateId: text('funnelTemplateId').notNull().references(() => funnelTemplate.id, { onDelete: 'cascade' }),
  license: text('license', { enum: ['PER_ORG'] }).notNull().default('PER_ORG'),
  pricePaid: integer('pricePaid').notNull().default(0),
  purchasedAt: integer('purchasedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('funnel_purchase_org_idx').on(t.organizationId),
  uniqueIndex('funnel_purchase_org_template_idx').on(t.organizationId, t.funnelTemplateId),
])

export type FunnelPurchase = typeof funnelPurchase.$inferSelect
export type NewFunnelPurchase = typeof funnelPurchase.$inferInsert

// Tracks a funnel instance installed into the org from a template (version + R2 key).
export const organizationFunnel = sqliteTable('organization_funnel', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  funnelId: text('funnelId').notNull().references(() => funnel.id, { onDelete: 'cascade' }),
  funnelTemplateId: text('funnelTemplateId').references(() => funnelTemplate.id, { onDelete: 'set null' }),
  version: text('version'),
  r2Key: text('r2Key'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('organization_funnel_org_idx').on(t.organizationId),
  uniqueIndex('organization_funnel_funnel_idx').on(t.funnelId),
])

export type OrganizationFunnel = typeof organizationFunnel.$inferSelect
export type NewOrganizationFunnel = typeof organizationFunnel.$inferInsert
