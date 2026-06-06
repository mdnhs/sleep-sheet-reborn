import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createGrowthService } from '../../services/v1/growth.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CampaignCreate = z.object({
  name: z.string().min(1), slug: z.string().optional(),
  type: z.enum(['PRODUCT', 'CATEGORY', 'SEASONAL']).optional(),
  startAt: z.string().optional(), endAt: z.string().optional(),
})
const CampaignUpdate = z.object({
  name: z.string().min(1).optional(), type: z.enum(['PRODUCT', 'CATEGORY', 'SEASONAL']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  startAt: z.string().nullable().optional(), endAt: z.string().nullable().optional(),
})
const FunnelCreate = z.object({
  name: z.string().min(1), slug: z.string().optional(), templateId: z.string().optional(),
  type: z.enum(['SINGLE', 'MULTI', 'BUNDLE', 'COD', 'LEAD', 'UPSELL', 'DOWNSELL']).optional(), config: z.any().optional(),
})
const FunnelUpdate = z.object({
  name: z.string().min(1).optional(), status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(), config: z.any().optional(),
})
const StepCreate = z.object({
  type: z.enum(['LANDING', 'UPSELL', 'DOWNSELL', 'CHECKOUT', 'THANKYOU']), position: z.number().int().optional(), config: z.any().optional(),
})
const StepUpdate = z.object({ position: z.number().int().optional(), config: z.any().optional() })
const VisitSchema = z.object({
  stepId: z.string().optional(), visitorId: z.string().optional(), ipAddress: z.string().optional(),
  utmSource: z.string().optional(), utmMedium: z.string().optional(), utmCampaign: z.string().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createGrowthService(c.get('db'), tenant.id)
}
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}
const actor = (c: any) => c.get('user')?.id

const app = new Hono<HonoEnv>()
  // ── Analytics overview (static path before params) ─────────────────────────────
  .get('/analytics', requirePermission('marketing.analytics'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getOverview())) } catch (e) { return fail(c, e, 'Failed to load analytics') }
  })
  .get('/funnel-templates', requirePermission('funnels.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listFunnelTemplates())) } catch (e) { return fail(c, e, 'Failed to load templates') }
  })

  // ── Campaigns ───────────────────────────────────────────────────────────────────
  .get('/campaigns', requirePermission('campaigns.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listCampaigns(c.req.query('status')))) } catch (e) { return fail(c, e, 'Failed to list campaigns') }
  })
  .post('/campaigns', requirePermission('campaigns.manage'), zValidator('json', CampaignCreate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createCampaign({ ...c.req.valid('json'), actorId: actor(c) })), 201) } catch (e) { return fail(c, e, 'Failed to create campaign') }
  })
  .get('/campaigns/:id', requirePermission('campaigns.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getCampaign(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to get campaign') }
  })
  .patch('/campaigns/:id', requirePermission('campaigns.manage'), zValidator('json', CampaignUpdate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateCampaign(c.req.param('id'), { ...c.req.valid('json'), actorId: actor(c) }))) } catch (e) { return fail(c, e, 'Failed to update campaign') }
  })
  .post('/campaigns/:id/products', requirePermission('campaigns.manage'), zValidator('json', z.object({ variantId: z.string().min(1) })), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.addCampaignProduct(c.req.param('id'), c.req.valid('json').variantId)), 201) } catch (e) { return fail(c, e, 'Failed to add product') }
  })
  .delete('/campaign-products/:id', requirePermission('campaigns.manage'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.removeCampaignProduct(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to remove product') }
  })
  .post('/campaigns/:id/track', requirePermission('campaigns.view'), zValidator('json', VisitSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.trackCampaignVisit(c.req.param('id'), c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to track visit') }
  })

  // ── Funnels ───────────────────────────────────────────────────────────────────
  .get('/funnels', requirePermission('funnels.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listFunnels(c.req.query('status')))) } catch (e) { return fail(c, e, 'Failed to list funnels') }
  })
  .post('/funnels', requirePermission('funnels.manage'), zValidator('json', FunnelCreate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createFunnel({ ...c.req.valid('json'), actorId: actor(c) })), 201) } catch (e) { return fail(c, e, 'Failed to create funnel') }
  })
  .get('/funnels/:id', requirePermission('funnels.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getFunnel(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to get funnel') }
  })
  .patch('/funnels/:id', requirePermission('funnels.manage'), zValidator('json', FunnelUpdate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateFunnel(c.req.param('id'), { ...c.req.valid('json'), actorId: actor(c) }))) } catch (e) { return fail(c, e, 'Failed to update funnel') }
  })
  .post('/funnels/:id/steps', requirePermission('funnels.manage'), zValidator('json', StepCreate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.addStep(c.req.param('id'), { ...c.req.valid('json'), actorId: actor(c) })), 201) } catch (e) { return fail(c, e, 'Failed to add step') }
  })
  .patch('/funnel-steps/:id', requirePermission('funnels.manage'), zValidator('json', StepUpdate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateStep(c.req.param('id'), c.req.valid('json')))) } catch (e) { return fail(c, e, 'Failed to update step') }
  })
  .delete('/funnel-steps/:id', requirePermission('funnels.manage'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.deleteStep(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to delete step') }
  })
  .post('/funnels/:id/track', requirePermission('funnels.view'), zValidator('json', VisitSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.trackFunnelVisit(c.req.param('id'), c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to track visit') }
  })

  // ── Attribution ─────────────────────────────────────────────────────────────────
  .post('/attribute/:orderId', requirePermission('campaigns.manage'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.attributeOrder(c.req.param('orderId'))), 201) } catch (e) { return fail(c, e, 'Failed to attribute order') }
  })

export default app
