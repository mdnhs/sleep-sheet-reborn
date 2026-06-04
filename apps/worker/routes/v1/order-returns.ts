import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createOrderReturnsService } from '../../services/v1/order-returns.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  orderId: z.string(),
  items: z.array(z.object({
    orderItemId: z.string(),
    variantId: z.string(),
    quantity: z.number().int().min(1),
  })).min(1),
  notes: z.string().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createOrderReturnsService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('orders.refund'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const orderId = c.req.query('orderId')
      const status = c.req.query('status')
      return c.json(ok(await s.list(orderId, status)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list returns'), 500)
    }
  })

  .post('/', requirePermission('orders.refund'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.create({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create return'), 500)
    }
  })

  .post('/:id/approve', requirePermission('orders.refund'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.approve(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to approve return'), 500)
    }
  })

  .post('/:id/cancel', requirePermission('orders.cancel'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.cancel(c.req.param('id'), c.get('user')?.id)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to cancel return'), 500)
    }
  })

export default app
