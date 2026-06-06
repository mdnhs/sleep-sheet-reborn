import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createDeliveryService } from '../../services/v1/delivery.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({ name: z.string().min(1), code: z.string().optional(), phone: z.string().optional() })
const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createDeliveryService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()
  .get('/', requirePermission('delivery.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listPartners(c.req.query('status')))) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to list partners'), 500) }
  })
  .post('/', requirePermission('delivery.update'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createPartner({ ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create partner'), 500)
    }
  })
  .patch('/:id', requirePermission('delivery.update'), zValidator('json', UpdateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updatePartner(c.req.param('id'), c.req.valid('json')))) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update partner'), 500)
    }
  })

export default app
