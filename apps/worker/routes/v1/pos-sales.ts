import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createPosService } from '../../services/v1/pos.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const PaymentSchema = z.object({
  method: z.enum(['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK', 'WALLET']),
  amount: z.number().int().min(1),
})

const ItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
  discount: z.number().int().min(0).default(0),
})

const CreateSaleSchema = z.object({
  sessionId: z.string().min(1),
  items: z.array(ItemSchema).min(1),
  payments: z.array(PaymentSchema).min(1),
  discount: z.number().int().min(0).default(0),
  tax: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  customerId: z.string().optional(),
})

const HoldSaleSchema = z.object({
  sessionId: z.string().min(1),
  items: z.array(ItemSchema).min(1),
  discount: z.number().int().min(0).default(0),
  tax: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  customerId: z.string().optional(),
})

const CompleteSaleSchema = z.object({
  payments: z.array(PaymentSchema).min(1),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createPosService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('pos.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const status = c.req.query('status') as any
      const sessionId = c.req.query('sessionId')
      return c.json(ok(await s.listSales(status, sessionId)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list POS sales'), 500)
    }
  })

  .get('/:id', requirePermission('pos.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getSale(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch POS sale'), 500)
    }
  })

  .post('/', requirePermission('pos.sale'), zValidator('json', CreateSaleSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.createSale({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create POS sale'), 500)
    }
  })

  .post('/hold', requirePermission('pos.sale'), zValidator('json', HoldSaleSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.holdSale({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to hold POS sale'), 500)
    }
  })

  .post('/:id/complete', requirePermission('pos.sale'), zValidator('json', CompleteSaleSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id
    try {
      const result = await s.completeSale(c.req.param('id'), c.req.valid('json').payments, userId)
      return c.json(ok(result))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to complete POS sale'), 500)
    }
  })

  .post('/:id/cancel', requirePermission('pos.sale'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id
    try {
      return c.json(ok(await s.cancelSale(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to cancel POS sale'), 500)
    }
  })

export default app
