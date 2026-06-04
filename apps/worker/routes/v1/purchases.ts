import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createPurchasesService } from '../../services/v1/purchases.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  supplierId: z.string(),
  receivingLocationId: z.string(),
  items: z.array(z.object({
    variantId: z.string(),
    quantity: z.number().int().min(1),
    unitCost: z.number().int().min(0),
  })).min(1),
  tax: z.number().int().min(0).default(0),
  discount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
})

const ReceiveSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    receivedQty: z.number().int().min(1),
  })).min(1),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createPurchasesService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('purchases.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const status = c.req.query('status') as any
      return c.json(ok(await s.list(status)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list purchase orders'), 500)
    }
  })

  .get('/:id', requirePermission('purchases.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.get(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch purchase order'), 500)
    }
  })

  .post('/', requirePermission('purchases.create'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.create({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create purchase order'), 500)
    }
  })

  .post('/:id/approve', requirePermission('purchases.approve'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.approve(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to approve purchase order'), 500)
    }
  })

  .post('/:id/receive', requirePermission('purchases.receive'), zValidator('json', ReceiveSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.receive(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to receive goods'), 500)
    }
  })

  .post('/:id/cancel', requirePermission('purchases.update'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.cancel(c.req.param('id'), c.get('user')?.id)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to cancel purchase order'), 500)
    }
  })

  .get('/:id/due', requirePermission('suppliers.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getSupplierDue(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch supplier due'), 500)
    }
  })

export default app
