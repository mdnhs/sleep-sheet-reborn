import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePlatformAdmin } from '../../middleware/rbac'
import { createPlatformAdminService } from '../../services/v1/platform-admin.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const svc = (c: any) => createPlatformAdminService(c.get('db'))
const actor = (c: any) => c.get('user')?.id
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}

const app = new Hono<HonoEnv>()
  .use('*', requirePlatformAdmin)
  .get('/', async (c) => {
    try { return c.json(ok(await svc(c).listOrganizations())) } catch (e) { return fail(c, e, 'Failed to list organizations') }
  })
  .post('/:id/suspend', async (c) => {
    try { return c.json(ok(await svc(c).suspendOrg(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to suspend') }
  })
  .post('/:id/reactivate', async (c) => {
    try { return c.json(ok(await svc(c).reactivateOrg(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to reactivate') }
  })
  .post('/:id/cancel', async (c) => {
    try { return c.json(ok(await svc(c).cancelOrg(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to cancel') }
  })
  .get('/:id/feature-flags', async (c) => {
    try { return c.json(ok(await svc(c).getOrgFeatureFlags(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to load flags') }
  })
  .post('/:id/feature-flags', zValidator('json', z.object({ flag: z.string().min(1), enabled: z.boolean() })), async (c) => {
    const b = c.req.valid('json')
    try { return c.json(ok(await svc(c).setOrgFeatureFlag(c.req.param('id'), b.flag, b.enabled, actor(c)))) } catch (e) { return fail(c, e, 'Failed to set flag') }
  })

export default app
