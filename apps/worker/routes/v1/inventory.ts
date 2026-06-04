import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createInventoryService } from '../../services/v1/inventory.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const AdjustSchema = z.object({
  variantId: z.string(),
  locationId: z.string(),
  quantity: z.number().int().min(0),
  notes: z.string().optional(),
})

const TransferCreateSchema = z.object({
  fromLocationId: z.string(),
  toLocationId: z.string(),
  items: z.array(z.object({
    variantId: z.string(),
    quantity: z.number().int().min(1),
  })).min(1),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createInventoryService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  // ── Stock queries ─────────────────────────────────────────────────────────

  .get('/stock', requirePermission('inventory.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { variantId, locationId } = c.req.query()
    if (!variantId || !locationId) return c.json(err('VALIDATION_ERROR', 'variantId and locationId required'), 400)
    try {
      return c.json(ok(await s.getStock(variantId, locationId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch stock'), 500)
    }
  })

  .get('/stock/variant/:variantId', requirePermission('inventory.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listStockByVariant(c.req.param('variantId'))))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch stock'), 500)
    }
  })

  .get('/stock/location/:locationId', requirePermission('inventory.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listStockByLocation(c.req.param('locationId'))))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch stock'), 500)
    }
  })

  // ── Adjustments ───────────────────────────────────────────────────────────

  .post('/adjustments', requirePermission('inventory.adjust'), zValidator('json', AdjustSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const body = c.req.valid('json')
      const result = await s.adjust({ ...body, createdBy: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to adjust stock'), 500)
    }
  })

  // ── Movements ledger ──────────────────────────────────────────────────────

  .get('/movements', requirePermission('inventory.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listMovements(c.req.query('variantId'), c.req.query('locationId'))))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list movements'), 500)
    }
  })

  // ── Transfers ─────────────────────────────────────────────────────────────

  .get('/transfers', requirePermission('inventory.transfer'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const status = c.req.query('status') as any
      return c.json(ok(await s.listTransfers(status)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list transfers'), 500)
    }
  })

  .get('/transfers/:id', requirePermission('inventory.transfer'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getTransfer(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('TRANSFER_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch transfer'), 500)
    }
  })

  .post('/transfers', requirePermission('inventory.transfer'), zValidator('json', TransferCreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.createTransfer(c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create transfer'), 500)
    }
  })

  .post('/transfers/:id/approve', requirePermission('inventory.transfer'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.approveTransfer(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to approve transfer'), 500)
    }
  })

  .post('/transfers/:id/receive', requirePermission('inventory.transfer'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      return c.json(ok(await s.receiveTransfer(c.req.param('id'), userId)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to receive transfer'), 500)
    }
  })

  .post('/transfers/:id/cancel', requirePermission('inventory.transfer'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.cancelTransfer(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to cancel transfer'), 500)
    }
  })

export default app
