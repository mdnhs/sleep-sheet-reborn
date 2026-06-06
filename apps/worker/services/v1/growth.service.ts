import type { Database, Campaign, Funnel, FunnelStep } from '@repo/database'
import { createCampaignsRepository } from '../../repositories/campaigns.repository'
import { createFunnelsRepository } from '../../repositories/funnels.repository'
import { createOrdersRepository } from '../../repositories/orders.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function createGrowthService(db: Database, organizationId: string) {
  const campaigns = createCampaignsRepository(db, organizationId)
  const funnels = createFunnelsRepository(db, organizationId)
  const orders = createOrdersRepository(db, organizationId)
  const audit = createAuditLogRepository(db, organizationId)

  return {
    // ── Campaigns ─────────────────────────────────────────────────────────────────
    listCampaigns(status?: string) { return campaigns.findMany(status as Campaign['status']) },

    async getCampaign(id: string) {
      const c = await campaigns.findById(id)
      if (!c) throw new ServiceError('Campaign not found', 404)
      const [products, stats] = await Promise.all([campaigns.findProducts(id), campaigns.stats(id)])
      return { ...c, products, stats }
    },

    async createCampaign(data: { name: string; slug?: string; type?: Campaign['type']; startAt?: string; endAt?: string; actorId?: string }) {
      const slug = slugify(data.slug || data.name)
      if (!slug) throw new ServiceError('A valid slug is required', 400)
      if (await campaigns.findBySlug(slug)) throw new ServiceError('A campaign with this slug already exists', 409)
      const row = await campaigns.create({
        name: data.name, slug, type: data.type ?? 'PRODUCT', status: 'DRAFT',
        startAt: data.startAt ? new Date(data.startAt) : null, endAt: data.endAt ? new Date(data.endAt) : null,
      })
      await audit.log('campaign', row.id, 'create', data.actorId, { slug })
      return row
    },

    async updateCampaign(id: string, data: { name?: string; type?: Campaign['type']; status?: Campaign['status']; startAt?: string | null; endAt?: string | null; actorId?: string }) {
      const existing = await campaigns.findById(id)
      if (!existing) throw new ServiceError('Campaign not found', 404)
      const patch: Record<string, unknown> = {}
      if (data.name != null) patch.name = data.name
      if (data.type != null) patch.type = data.type
      if (data.status != null) patch.status = data.status
      if (data.startAt !== undefined) patch.startAt = data.startAt ? new Date(data.startAt) : null
      if (data.endAt !== undefined) patch.endAt = data.endAt ? new Date(data.endAt) : null
      const updated = await campaigns.update(id, patch)
      await audit.log('campaign', id, 'update', data.actorId, { fields: Object.keys(patch) })
      return updated
    },

    async addCampaignProduct(campaignId: string, variantId: string) {
      const c = await campaigns.findById(campaignId)
      if (!c) throw new ServiceError('Campaign not found', 404)
      const existing = await campaigns.findProducts(campaignId)
      if (existing.some(p => p.variantId === variantId)) throw new ServiceError('Variant already in campaign', 409)
      return campaigns.addProduct(campaignId, variantId)
    },
    async removeCampaignProduct(id: string) { await campaigns.removeProduct(id); return { id } },

    // ── Funnels ───────────────────────────────────────────────────────────────────
    listFunnelTemplates() { return funnels.listTemplates() },
    listFunnels(status?: string) { return funnels.findMany(status as Funnel['status']) },

    async getFunnel(id: string) {
      const f = await funnels.findById(id)
      if (!f) throw new ServiceError('Funnel not found', 404)
      const [steps, stats] = await Promise.all([funnels.findSteps(id), funnels.stats(id)])
      return { ...f, steps, stats }
    },

    async createFunnel(data: { name: string; slug?: string; type?: Funnel['type']; templateId?: string; config?: unknown; actorId?: string }) {
      const slug = slugify(data.slug || data.name)
      if (!slug) throw new ServiceError('A valid slug is required', 400)
      if (await funnels.findBySlug(slug)) throw new ServiceError('A funnel with this slug already exists', 409)
      let type = data.type ?? 'SINGLE'
      if (data.templateId) {
        const tpl = await funnels.findTemplate(data.templateId)
        if (!tpl) throw new ServiceError('Funnel template not found', 404)
        type = tpl.type
      }
      const row = await funnels.create({
        templateId: data.templateId ?? null, name: data.name, slug, type,
        config: data.config != null ? JSON.stringify(data.config) : null, status: 'DRAFT',
      })
      await audit.log('funnel', row.id, 'create', data.actorId, { slug, type })
      return row
    },

    async updateFunnel(id: string, data: { name?: string; status?: Funnel['status']; config?: unknown; actorId?: string }) {
      const existing = await funnels.findById(id)
      if (!existing) throw new ServiceError('Funnel not found', 404)
      const patch: Record<string, unknown> = {}
      if (data.name != null) patch.name = data.name
      if (data.status != null) patch.status = data.status
      if (data.config !== undefined) patch.config = data.config != null ? JSON.stringify(data.config) : null
      const updated = await funnels.update(id, patch)
      await audit.log('funnel', id, 'update', data.actorId, { fields: Object.keys(patch) })
      return updated
    },

    // Funnel steps
    async addStep(funnelId: string, data: { type: FunnelStep['type']; position?: number; config?: unknown; actorId?: string }) {
      const f = await funnels.findById(funnelId)
      if (!f) throw new ServiceError('Funnel not found', 404)
      const steps = await funnels.findSteps(funnelId)
      const row = await funnels.addStep({
        funnelId, type: data.type, position: data.position ?? steps.length,
        config: data.config != null ? JSON.stringify(data.config) : null,
      })
      await audit.log('funnel_step', row.id, 'create', data.actorId, { funnelId, type: data.type })
      return row
    },
    async updateStep(id: string, data: { position?: number; config?: unknown }) {
      const existing = await funnels.findStep(id)
      if (!existing) throw new ServiceError('Step not found', 404)
      const patch: Partial<Pick<FunnelStep, 'position' | 'config'>> = {}
      if (data.position != null) patch.position = data.position
      if (data.config !== undefined) patch.config = data.config != null ? JSON.stringify(data.config) : null
      return funnels.updateStep(id, patch)
    },
    async deleteStep(id: string) {
      const existing = await funnels.findStep(id)
      if (!existing) throw new ServiceError('Step not found', 404)
      await funnels.deleteStep(id)
      return { id }
    },

    // ── Attribution (UTM) ───────────────────────────────────────────────────────────
    async trackCampaignVisit(campaignId: string, data: { visitorId?: string; ipAddress?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string }) {
      const c = await campaigns.findById(campaignId)
      if (!c) throw new ServiceError('Campaign not found', 404)
      return campaigns.addVisit({
        campaignId, visitorId: data.visitorId ?? null, ipAddress: data.ipAddress ?? null,
        utmSource: data.utmSource ?? null, utmMedium: data.utmMedium ?? null, utmCampaign: data.utmCampaign ?? null,
      })
    },
    async trackFunnelVisit(funnelId: string, data: { stepId?: string; visitorId?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string }) {
      const f = await funnels.findById(funnelId)
      if (!f) throw new ServiceError('Funnel not found', 404)
      return funnels.addVisit({
        funnelId, stepId: data.stepId ?? null, visitorId: data.visitorId ?? null,
        utmSource: data.utmSource ?? null, utmMedium: data.utmMedium ?? null, utmCampaign: data.utmCampaign ?? null,
      })
    },

    /**
     * Attribute an order to its campaign and/or funnel (read from order.campaignId /
     * order.funnelId). Idempotent per (source, order). Revenue = order.grandTotal.
     */
    async attributeOrder(orderId: string) {
      const order = await orders.findById(orderId)
      if (!order) throw new ServiceError('Order not found', 404)
      const result: { campaign?: unknown; funnel?: unknown } = {}
      if (order.campaignId && await campaigns.findById(order.campaignId)) {
        if (!(await campaigns.findConversionByOrder(order.campaignId, orderId))) {
          result.campaign = await campaigns.addConversion({ campaignId: order.campaignId, orderId, revenue: order.grandTotal })
        }
      }
      if (order.funnelId && await funnels.findById(order.funnelId)) {
        if (!(await funnels.findConversionByOrder(order.funnelId, orderId))) {
          result.funnel = await funnels.addConversion({ funnelId: order.funnelId, orderId, revenue: order.grandTotal })
        }
      }
      return result
    },

    // ── Analytics ─────────────────────────────────────────────────────────────────
    async getOverview() {
      const [allCampaigns, allFunnels] = await Promise.all([campaigns.findMany(), funnels.findMany()])
      const campaignRows = await Promise.all(allCampaigns.map(async (c) => ({ id: c.id, name: c.name, status: c.status, ...(await campaigns.stats(c.id)) })))
      const funnelRows = await Promise.all(allFunnels.map(async (f) => ({ id: f.id, name: f.name, type: f.type, status: f.status, ...(await funnels.stats(f.id)) })))
      return {
        campaigns: campaignRows,
        funnels: funnelRows,
        totalRevenue: campaignRows.reduce((s, r) => s + r.revenue, 0) + funnelRows.reduce((s, r) => s + r.revenue, 0),
      }
    },
  }
}

export type GrowthService = ReturnType<typeof createGrowthService>
