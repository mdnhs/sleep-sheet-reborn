import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createDeliveryService } from '../../services/v1/delivery.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  orderId: z.string().min(1),
  deliveryPartnerId: z.string().optional(),
  originLocationId: z.string().optional(),
  codAmount: z.number().int().min(0).optional(),
})
const AssignRiderSchema = z.object({ riderId: z.string().min(1) })
const AssignPartnerSchema = z.object({ deliveryPartnerId: z.string().min(1) })
const FailSchema = z.object({ reason: z.string().min(1) })
const CourierSchema = z.object({ courierStatus: z.string().min(1), note: z.string().optional() })

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createDeliveryService(c.get('db'), tenant.id)
}

function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}

const app = new Hono<HonoEnv>()
  .get('/', requirePermission('delivery.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listShipments(c.req.query('status')))) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to list shipments'), 500) }
  })

  .get('/reports', requirePermission('delivery.reports'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getReports())) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to load reports'), 500) }
  })

  .get('/:id', requirePermission('delivery.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getShipment(c.req.param('id')))) }
    catch (e) { return fail(c, e, 'Failed to fetch shipment') }
  })

  .post('/', requirePermission('delivery.create'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createShipment({ ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) { return fail(c, e, 'Failed to create shipment') }
  })

  .post('/:id/assign-rider', requirePermission('delivery.assign'), zValidator('json', AssignRiderSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.assignRider(c.req.param('id'), c.req.valid('json').riderId, c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to assign rider') }
  })

  .post('/:id/assign-partner', requirePermission('delivery.assign'), zValidator('json', AssignPartnerSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.assignPartner(c.req.param('id'), c.req.valid('json').deliveryPartnerId, c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to assign partner') }
  })

  .post('/:id/pickup', requirePermission('delivery.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.pickup(c.req.param('id'), c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to pick up') }
  })

  .post('/:id/transit', requirePermission('delivery.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.transit(c.req.param('id'), c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to update transit') }
  })

  .post('/:id/deliver', requirePermission('delivery.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.deliver(c.req.param('id'), c.get('user')?.id ?? ''))) }
    catch (e) { return fail(c, e, 'Failed to deliver') }
  })

  .post('/:id/fail', requirePermission('delivery.update'), zValidator('json', FailSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.fail(c.req.param('id'), c.req.valid('json').reason, c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to mark failed') }
  })

  .post('/:id/return', requirePermission('delivery.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.returnToOrigin(c.req.param('id'), c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to return to origin') }
  })

  .post('/:id/cancel', requirePermission('delivery.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.cancel(c.req.param('id'), c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to cancel') }
  })

  .post('/:id/courier-status', requirePermission('delivery.update'), zValidator('json', CourierSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { courierStatus, note } = c.req.valid('json')
    try { return c.json(ok(await s.syncCourierStatus(c.req.param('id'), courierStatus, note, c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to sync courier status') }
  })

export default app
