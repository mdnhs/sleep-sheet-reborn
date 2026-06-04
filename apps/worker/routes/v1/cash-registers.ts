import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createPosService } from '../../services/v1/pos.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1),
})

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createPosService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('pos.cash_register'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listRegisters()))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list registers'), 500)
    }
  })

  .get('/:id', requirePermission('pos.cash_register'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getRegister(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch register'), 500)
    }
  })

  .post('/', requirePermission('pos.cash_register'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.createRegister({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create register'), 500)
    }
  })

  .patch('/:id', requirePermission('pos.cash_register'), zValidator('json', UpdateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.updateRegister(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update register'), 500)
    }
  })

export default app
