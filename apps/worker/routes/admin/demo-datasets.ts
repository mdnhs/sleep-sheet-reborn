import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePlatformAdmin } from '../../middleware/rbac'
import { createDemoAdminService } from '../../services/v1/demo.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const svc = (c: any) => createDemoAdminService(c.get('db'))
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}

const app = new Hono<HonoEnv>()
  .use('*', requirePlatformAdmin)
  .get('/', async (c) => {
    try { return c.json(ok(await svc(c).list())) } catch (e) { return fail(c, e, 'Failed to list datasets') }
  })
  .post('/', zValidator('json', z.object({
    name: z.string().min(1), businessType: z.string().optional(), description: z.string().optional(), payload: z.any(),
  })), async (c) => {
    try { return c.json(ok(await svc(c).create(c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to create dataset') }
  })
  .post('/:id/status', zValidator('json', z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) })), async (c) => {
    try { return c.json(ok(await svc(c).setStatus(c.req.param('id'), c.req.valid('json').status))) } catch (e) { return fail(c, e, 'Failed to update dataset') }
  })

export default app
