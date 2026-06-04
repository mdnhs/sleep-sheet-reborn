import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createPosReturnsService } from '../../services/v1/pos-returns.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  saleId: z.string().min(1),
  items: z.array(z.object({
    saleItemId: z.string().min(1),
    variantId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1),
  notes: z.string().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createPosReturnsService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('pos.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const saleId = c.req.query('saleId')
      const status = c.req.query('status')
      return c.json(ok(await s.list(saleId, status)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list POS returns'), 500)
    }
  })

  .get('/:id', requirePermission('pos.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.get(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch POS return'), 500)
    }
  })

  .post('/', requirePermission('pos.return'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.create({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create POS return'), 500)
    }
  })

  .post('/:id/approve', requirePermission('pos.return'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.approve(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to approve POS return'), 500)
    }
  })

  .post('/:id/cancel', requirePermission('pos.return'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id
    try {
      return c.json(ok(await s.cancel(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to cancel POS return'), 500)
    }
  })

export default app
