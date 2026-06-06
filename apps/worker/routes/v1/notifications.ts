import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createNotificationsService } from '../../services/v1/notifications.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createNotificationsService(c.get('db'), tenant.id)
}
const uid = (c: any) => c.get('user')?.id
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}

const app = new Hono<HonoEnv>()
  .get('/', requirePermission('notifications.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.feed(uid(c)))) } catch (e) { return fail(c, e, 'Failed to load notifications') }
  })
  .get('/unread-count', requirePermission('notifications.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const items = await s.list(uid(c), { unreadOnly: true, limit: 1000 })
      return c.json(ok({ unread: items.length }))
    } catch (e) { return fail(c, e, 'Failed to count notifications') }
  })
  .post('/', requirePermission('notifications.manage'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.create(c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to create notification') }
  })
  .post('/:id/read', requirePermission('notifications.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.markRead(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to mark read') }
  })
  .post('/read-all', requirePermission('notifications.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.markAllRead(uid(c)))) } catch (e) { return fail(c, e, 'Failed to mark all read') }
  })

export default app
