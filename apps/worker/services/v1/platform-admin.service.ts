import { eq, sql, desc } from 'drizzle-orm'
import {
  organization, subscription, subscriptionPlan, order, posSale,
  theme, themeVersion, funnelTemplate,
} from '@repo/database/schema'
import type { Database, NewTheme, NewFunnelTemplate } from '@repo/database'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'
import { generateId } from '../../utils/id'

type OrgStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'

/** Platform (SUPER_ADMIN) administration. UNSCOPED — operates across all organizations. */
export function createPlatformAdminService(db: Database) {
  return {
    // ── Organizations ────────────────────────────────────────────────────────────
    async listOrganizations() {
      return db.select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        status: organization.status,
        createdAt: organization.createdAt,
        subscriptionStatus: subscription.status,
        planName: subscriptionPlan.name,
      })
        .from(organization)
        .leftJoin(subscription, eq(subscription.organizationId, organization.id))
        .leftJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
        .orderBy(desc(organization.createdAt))
    },

    async setOrgStatus(organizationId: string, status: OrgStatus, action: string, actorId?: string) {
      const [org] = await db.select().from(organization).where(eq(organization.id, organizationId)).limit(1)
      if (!org) throw new ServiceError('Organization not found', 404)
      await db.update(organization).set({ status, updatedAt: new Date() }).where(eq(organization.id, organizationId))
      const audit = createAuditLogRepository(db, organizationId)
      await audit.log('organization', organizationId, action, actorId, { from: org.status, to: status })
      return { id: organizationId, status }
    },
    suspendOrg(id: string, actorId?: string) { return this.setOrgStatus(id, 'SUSPENDED', 'suspend', actorId) },
    reactivateOrg(id: string, actorId?: string) { return this.setOrgStatus(id, 'ACTIVE', 'reactivate', actorId) },
    cancelOrg(id: string, actorId?: string) { return this.setOrgStatus(id, 'CANCELLED', 'cancel', actorId) },

    // ── SaaS Analytics (derived) ───────────────────────────────────────────────────
    async getAnalytics() {
      const orgs = await db.select({ status: organization.status, n: sql<number>`COUNT(*)` })
        .from(organization).groupBy(organization.status)
      const byStatus: Record<string, number> = {}
      let totalOrgs = 0
      for (const r of orgs) { byStatus[r.status] = r.n; totalOrgs += r.n }

      // MRR from ACTIVE subscriptions, normalized to monthly (price in paisa)
      const subs = await db.select({ price: subscriptionPlan.price, cycle: subscriptionPlan.billingCycle })
        .from(subscription)
        .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
        .where(eq(subscription.status, 'ACTIVE'))
      const mrrPaisa = subs.reduce((s, r) => s + (r.cycle === 'YEARLY' ? Math.round((r.price ?? 0) / 12) : (r.price ?? 0)), 0)

      const [ord] = await db.select({ rev: sql<number>`COALESCE(SUM(${order.grandTotal}),0)` }).from(order)
      const [pos] = await db.select({ rev: sql<number>`COALESCE(SUM(${posSale.grandTotal}),0)` })
        .from(posSale).where(eq(posSale.status, 'COMPLETED'))

      const active = byStatus['ACTIVE'] ?? 0
      const trial = byStatus['TRIAL'] ?? 0
      const cancelled = byStatus['CANCELLED'] ?? 0
      const suspended = byStatus['SUSPENDED'] ?? 0
      return {
        totalOrgs,
        activeOrgs: active,
        trialOrgs: trial,
        suspendedOrgs: suspended,
        cancelledOrgs: cancelled,
        mrr: mrrPaisa,
        arr: mrrPaisa * 12,
        // conversion: active out of all orgs that ever started a trial-or-better
        trialConversionRate: active + trial > 0 ? Math.round((active / (active + trial)) * 10000) / 100 : 0,
        churnRate: totalOrgs > 0 ? Math.round((cancelled / totalOrgs) * 10000) / 100 : 0,
        platformGmv: (ord?.rev ?? 0) + (pos?.rev ?? 0),
      }
    },

    // ── Marketplace catalog management ───────────────────────────────────────────────
    listThemes() { return db.select().from(theme).orderBy(theme.name) },
    async createTheme(data: { name: string; slug: string; type?: 'FREE' | 'PREMIUM'; category?: string; price?: number; description?: string; author?: string }) {
      const existing = await db.select().from(theme).where(eq(theme.slug, data.slug)).limit(1)
      if (existing.length) throw new ServiceError('A theme with this slug already exists', 409)
      const now = new Date()
      const row: NewTheme = {
        id: generateId(), name: data.name, slug: data.slug, type: data.type ?? 'FREE',
        category: data.category ?? null, price: data.price ?? 0, previewImage: null,
        description: data.description ?? null, author: data.author ?? 'Platform', status: 'ACTIVE',
        createdAt: now, updatedAt: now,
      }
      await db.insert(theme).values(row)
      return row
    },
    async setThemeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
      const [t] = await db.select().from(theme).where(eq(theme.id, id)).limit(1)
      if (!t) throw new ServiceError('Theme not found', 404)
      await db.update(theme).set({ status, updatedAt: new Date() }).where(eq(theme.id, id))
      return { id, status }
    },
    async addThemeVersion(themeId: string, data: { version: string; r2Key?: string; releaseNotes?: string }) {
      const [t] = await db.select().from(theme).where(eq(theme.id, themeId)).limit(1)
      if (!t) throw new ServiceError('Theme not found', 404)
      const row = { id: generateId(), themeId, version: data.version, r2Key: data.r2Key ?? null, releaseNotes: data.releaseNotes ?? null, createdAt: new Date() }
      await db.insert(themeVersion).values(row)
      return row
    },

    listFunnelTemplates() { return db.select().from(funnelTemplate).orderBy(funnelTemplate.name) },
    async createFunnelTemplate(data: { name: string; type: NewFunnelTemplate['type']; category?: string; price?: number }) {
      const now = new Date()
      const row: NewFunnelTemplate = {
        id: generateId(), name: data.name, type: data.type, category: data.category ?? null,
        price: data.price ?? 0, status: 'ACTIVE', createdAt: now, updatedAt: now,
      }
      await db.insert(funnelTemplate).values(row)
      return row
    },
    async setFunnelTemplateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
      const [t] = await db.select().from(funnelTemplate).where(eq(funnelTemplate.id, id)).limit(1)
      if (!t) throw new ServiceError('Funnel template not found', 404)
      await db.update(funnelTemplate).set({ status, updatedAt: new Date() }).where(eq(funnelTemplate.id, id))
      return { id, status }
    },
  }
}

export type PlatformAdminService = ReturnType<typeof createPlatformAdminService>
