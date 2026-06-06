import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createMarketplaceService } from '../../services/v1/marketplace.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createMarketplaceService(c.get('db'), tenant.id)
}
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}
const actor = (c: any) => c.get('user')?.id

const app = new Hono<HonoEnv>()
  // ── Theme marketplace ────────────────────────────────────────────────────────────
  .get('/themes', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.browseThemes())) } catch (e) { return fail(c, e, 'Failed to browse themes') }
  })
  .post('/themes/:themeId/purchase', requirePermission('themes.install'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.purchaseTheme(c.req.param('themeId'), actor(c))), 201) } catch (e) { return fail(c, e, 'Failed to purchase theme') }
  })
  .post('/themes/:themeId/install', requirePermission('themes.install'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.installTheme(c.req.param('themeId'), actor(c))), 201) } catch (e) { return fail(c, e, 'Failed to install theme') }
  })
  .post('/org-themes/:id/activate', requirePermission('themes.activate'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.activateTheme(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to activate theme') }
  })
  .post('/org-themes/:id/update', requirePermission('themes.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateTheme(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to update theme') }
  })

  // ── Funnel marketplace ───────────────────────────────────────────────────────────
  .get('/funnels', requirePermission('funnels.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.browseFunnels())) } catch (e) { return fail(c, e, 'Failed to browse funnels') }
  })
  .get('/installed-funnels', requirePermission('funnels.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listInstalledFunnels())) } catch (e) { return fail(c, e, 'Failed to list installed funnels') }
  })
  .post('/funnels/:templateId/purchase', requirePermission('funnels.install'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.purchaseFunnelTemplate(c.req.param('templateId'), actor(c))), 201) } catch (e) { return fail(c, e, 'Failed to purchase funnel template') }
  })
  .post('/funnels/:templateId/install', requirePermission('funnels.install'), zValidator('json', z.object({ name: z.string().optional() })), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.installFunnel(c.req.param('templateId'), c.req.valid('json').name, actor(c))), 201) } catch (e) { return fail(c, e, 'Failed to install funnel') }
  })

export default app
