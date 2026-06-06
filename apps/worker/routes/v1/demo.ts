import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createDemoService } from '../../services/v1/demo.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createDemoService(c.get('db'), tenant.id)
}
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}
const actor = (c: any) => c.get('user')?.id

const app = new Hono<HonoEnv>()
  .get('/datasets', requirePermission('organization.demo_data'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listDatasets())) } catch (e) { return fail(c, e, 'Failed to list datasets') }
  })
  .get('/imports', requirePermission('organization.demo_data'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listImports())) } catch (e) { return fail(c, e, 'Failed to list imports') }
  })
  .post('/import', requirePermission('organization.demo_data'), zValidator('json', z.object({ datasetId: z.string().min(1) })), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.import(c.req.valid('json').datasetId, actor(c))), 201) } catch (e) { return fail(c, e, 'Failed to import dataset') }
  })
  .post('/imports/:id/clear', requirePermission('organization.demo_data'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.clear(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to clear import') }
  })

export default app
