import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createOrdersService } from '../../services/v1/orders.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const AddressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  area: z.string().optional(),
  city: z.string().min(1),
})

const CreateSchema = z.object({
  items: z.array(z.object({
    variantId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().int().min(0),
    discount: z.number().int().min(0).default(0),
  })).min(1),
  address: AddressSchema,
  locationId: z.string(),
  source: z.enum(['POS', 'WEBSITE', 'FUNNEL', 'MANUAL', 'API']).default('MANUAL'),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD', 'SSLCOMMERZ', 'BANK', 'WALLET']).optional(),
  notes: z.string().optional(),
  customerNotes: z.string().optional(),
  customerId: z.string().optional(),
  campaignId: z.string().optional(),
  funnelId: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  discount: z.number().int().min(0).default(0),
  tax: z.number().int().min(0).default(0),
  shippingCost: z.number().int().min(0).default(0),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createOrdersService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('orders.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const status = c.req.query('status') as any
      return c.json(ok(await s.list(status)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list orders'), 500)
    }
  })

  .get('/:id', requirePermission('orders.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.get(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch order'), 500)
    }
  })

  .post('/', requirePermission('orders.create'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.create({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create order'), 500)
    }
  })

  .post('/:id/confirm', requirePermission('orders.update'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.confirm(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to confirm order'), 500)
    }
  })

  .post('/:id/process', requirePermission('orders.update'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.process(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to process order'), 500)
    }
  })

  .post('/:id/pack', requirePermission('orders.update'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.pack(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to pack order'), 500)
    }
  })

  .post('/:id/ship', requirePermission('orders.update'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.ship(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to ship order'), 500)
    }
  })

  .post('/:id/deliver', requirePermission('orders.update'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.deliver(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to deliver order'), 500)
    }
  })

  .post('/:id/cancel', requirePermission('orders.cancel'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.cancel(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to cancel order'), 500)
    }
  })

export default app
