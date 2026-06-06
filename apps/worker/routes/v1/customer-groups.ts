import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createCustomersService } from '../../services/v1/customers.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({ name: z.string().min(1), discountPercent: z.number().int().min(0).max(100).optional() })
const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createCustomersService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()
  .get('/', requirePermission('customers.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listGroups(c.req.query('status')))) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to list groups'), 500) }
  })
  .post('/', requirePermission('customers.update'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createGroup({ ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create group'), 500)
    }
  })
  .patch('/:id', requirePermission('customers.update'), zValidator('json', UpdateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateGroup(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id }))) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update group'), 500)
    }
  })

export default app
