import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { organization } from './organizations'
import { productVariant } from './catalog'
import { order } from './orders'

// ─── Funnel templates (global catalog) ───────────────────────────────────────────

export const funnelTemplate = sqliteTable('funnel_template', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['SINGLE', 'MULTI', 'BUNDLE', 'COD', 'LEAD', 'UPSELL', 'DOWNSELL'] }).notNull(),
  category: text('category'),
  price: integer('price').notNull().default(0),
  status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export type FunnelTemplate = typeof funnelTemplate.$inferSelect
export type NewFunnelTemplate = typeof funnelTemplate.$inferInsert

// ─── Campaigns ───────────────────────────────────────────────────────────────────
// Growth is a decoupled layer: campaigns/funnels measure & convert, never mutate ERP.

export const campaign = sqliteTable('campaign', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: text('type', { enum: ['PRODUCT', 'CATEGORY', 'SEASONAL'] }).notNull().default('PRODUCT'),
  status: text('status', { enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'] }).notNull().default('DRAFT'),
  startAt: integer('startAt', { mode: 'timestamp' }),
  endAt: integer('endAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('campaign_org_idx').on(t.organizationId),
  index('campaign_org_status_idx').on(t.organizationId, t.status),
  uniqueIndex('campaign_org_slug_idx').on(t.organizationId, t.slug),
])

export type Campaign = typeof campaign.$inferSelect
export type NewCampaign = typeof campaign.$inferInsert

export const campaignProduct = sqliteTable('campaign_product', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  campaignId: text('campaignId').notNull().references(() => campaign.id, { onDelete: 'cascade' }),
  variantId: text('variantId').notNull().references(() => productVariant.id, { onDelete: 'cascade' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('campaign_product_org_idx').on(t.organizationId),
  uniqueIndex('campaign_product_campaign_variant_idx').on(t.campaignId, t.variantId),
])

export type CampaignProduct = typeof campaignProduct.$inferSelect
export type NewCampaignProduct = typeof campaignProduct.$inferInsert

// ─── Visits (UTM attribution) — shared shape for campaigns and funnels ───────────

export const campaignVisit = sqliteTable('campaign_visit', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  campaignId: text('campaignId').notNull().references(() => campaign.id, { onDelete: 'cascade' }),
  visitorId: text('visitorId'),
  ipAddress: text('ipAddress'),
  utmSource: text('utmSource'),
  utmMedium: text('utmMedium'),
  utmCampaign: text('utmCampaign'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('campaign_visit_org_idx').on(t.organizationId),
  index('campaign_visit_campaign_idx').on(t.campaignId),
])

export type CampaignVisit = typeof campaignVisit.$inferSelect
export type NewCampaignVisit = typeof campaignVisit.$inferInsert

export const campaignConversion = sqliteTable('campaign_conversion', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  campaignId: text('campaignId').notNull().references(() => campaign.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  revenue: integer('revenue').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('campaign_conversion_org_idx').on(t.organizationId),
  index('campaign_conversion_campaign_idx').on(t.campaignId),
  uniqueIndex('campaign_conversion_order_idx').on(t.campaignId, t.orderId),
])

export type CampaignConversion = typeof campaignConversion.$inferSelect
export type NewCampaignConversion = typeof campaignConversion.$inferInsert

// ─── Funnels ─────────────────────────────────────────────────────────────────────

export const funnel = sqliteTable('funnel', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  templateId: text('templateId').references(() => funnelTemplate.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: text('type', { enum: ['SINGLE', 'MULTI', 'BUNDLE', 'COD', 'LEAD', 'UPSELL', 'DOWNSELL'] }).notNull().default('SINGLE'),
  config: text('config'), // JSON
  status: text('status', { enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'] }).notNull().default('DRAFT'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('funnel_org_idx').on(t.organizationId),
  index('funnel_org_status_idx').on(t.organizationId, t.status),
  uniqueIndex('funnel_org_slug_idx').on(t.organizationId, t.slug),
])

export type Funnel = typeof funnel.$inferSelect
export type NewFunnel = typeof funnel.$inferInsert

// Ordered funnel steps: landing → upsell/downsell → checkout → thank-you
export const funnelStep = sqliteTable('funnel_step', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  funnelId: text('funnelId').notNull().references(() => funnel.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['LANDING', 'UPSELL', 'DOWNSELL', 'CHECKOUT', 'THANKYOU'] }).notNull(),
  position: integer('position').notNull().default(0),
  config: text('config'), // JSON: sections/blocks, product, offer
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('funnel_step_org_idx').on(t.organizationId),
  index('funnel_step_funnel_idx').on(t.funnelId),
])

export type FunnelStep = typeof funnelStep.$inferSelect
export type NewFunnelStep = typeof funnelStep.$inferInsert

export const funnelVisit = sqliteTable('funnel_visit', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  funnelId: text('funnelId').notNull().references(() => funnel.id, { onDelete: 'cascade' }),
  stepId: text('stepId').references(() => funnelStep.id, { onDelete: 'set null' }),
  visitorId: text('visitorId'),
  utmSource: text('utmSource'),
  utmMedium: text('utmMedium'),
  utmCampaign: text('utmCampaign'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('funnel_visit_org_idx').on(t.organizationId),
  index('funnel_visit_funnel_idx').on(t.funnelId),
])

export type FunnelVisit = typeof funnelVisit.$inferSelect
export type NewFunnelVisit = typeof funnelVisit.$inferInsert

export const funnelConversion = sqliteTable('funnel_conversion', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  funnelId: text('funnelId').notNull().references(() => funnel.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  revenue: integer('revenue').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
}, (t) => [
  index('funnel_conversion_org_idx').on(t.organizationId),
  index('funnel_conversion_funnel_idx').on(t.funnelId),
  uniqueIndex('funnel_conversion_order_idx').on(t.funnelId, t.orderId),
])

export type FunnelConversion = typeof funnelConversion.$inferSelect
export type NewFunnelConversion = typeof funnelConversion.$inferInsert
