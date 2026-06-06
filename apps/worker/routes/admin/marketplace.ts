import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePlatformAdmin } from '../../middleware/rbac'
import { createPlatformAdminService } from '../../services/v1/platform-admin.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const ThemeCreate = z.object({
  name: z.string().min(1), slug: z.string().min(1), type: z.enum(['FREE', 'PREMIUM']).optional(),
  category: z.string().optional(), price: z.number().int().min(0).optional(), description: z.string().optional(), author: z.string().optional(),
})
const VersionCreate = z.object({ version: z.string().min(1), r2Key: z.string().optional(), releaseNotes: z.string().optional() })
const StatusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) })
const TemplateCreate = z.object({
  name: z.string().min(1), type: z.enum(['SINGLE', 'MULTI', 'BUNDLE', 'COD', 'LEAD', 'UPSELL', 'DOWNSELL']),
  category: z.string().optional(), price: z.number().int().min(0).optional(),
})

const svc = (c: any) => createPlatformAdminService(c.get('db'))
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}

const app = new Hono<HonoEnv>()
  .use('*', requirePlatformAdmin)

  // Themes catalog
  .get('/themes', async (c) => {
    try { return c.json(ok(await svc(c).listThemes())) } catch (e) { return fail(c, e, 'Failed to list themes') }
  })
  .post('/themes', zValidator('json', ThemeCreate), async (c) => {
    try { return c.json(ok(await svc(c).createTheme(c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to create theme') }
  })
  .post('/themes/:id/status', zValidator('json', StatusSchema), async (c) => {
    try { return c.json(ok(await svc(c).setThemeStatus(c.req.param('id'), c.req.valid('json').status))) } catch (e) { return fail(c, e, 'Failed to update theme') }
  })
  .post('/themes/:id/versions', zValidator('json', VersionCreate), async (c) => {
    try { return c.json(ok(await svc(c).addThemeVersion(c.req.param('id'), c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to add version') }
  })

  // Funnel templates catalog
  .get('/funnel-templates', async (c) => {
    try { return c.json(ok(await svc(c).listFunnelTemplates())) } catch (e) { return fail(c, e, 'Failed to list templates') }
  })
  .post('/funnel-templates', zValidator('json', TemplateCreate), async (c) => {
    try { return c.json(ok(await svc(c).createFunnelTemplate(c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to create template') }
  })
  .post('/funnel-templates/:id/status', zValidator('json', StatusSchema), async (c) => {
    try { return c.json(ok(await svc(c).setFunnelTemplateStatus(c.req.param('id'), c.req.valid('json').status))) } catch (e) { return fail(c, e, 'Failed to update template') }
  })

export default app
