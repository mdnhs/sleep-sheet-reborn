import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createCustomersService } from '../../services/v1/customers.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  groupId: z.string().optional(),
  type: z.enum(['GUEST', 'REGISTERED', 'WHOLESALE', 'CORPORATE']).optional(),
  dateOfBirth: z.string().optional(),
  notes: z.string().optional(),
})
const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  groupId: z.string().nullable().optional(),
  type: z.enum(['GUEST', 'REGISTERED', 'WHOLESALE', 'CORPORATE']).optional(),
  dateOfBirth: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})
const AddressSchema = z.object({
  type: z.enum(['BILLING', 'SHIPPING']).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  addressLine: z.string().min(1),
  area: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
})
const AmountSchema = z.object({
  amount: z.number().int().positive(),
  source: z.string().optional(),
  note: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
})
const PointsSchema = z.object({
  points: z.number().int().positive(),
  source: z.string().optional(),
  note: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createCustomersService(c.get('db'), tenant.id)
}
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}

const app = new Hono<HonoEnv>()
  // ── Reports (static path before /:id) ───────────────────────────────────────────
  .get('/reports', requirePermission('customers.reports'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getReports())) }
    catch (e) { return fail(c, e, 'Failed to build customer reports') }
  })

  // ── Customers ───────────────────────────────────────────────────────────────────
  .get('/', requirePermission('customers.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listCustomers({
        status: c.req.query('status'), groupId: c.req.query('groupId'), search: c.req.query('search'),
      })))
    } catch (e) { return fail(c, e, 'Failed to list customers') }
  })
  .post('/', requirePermission('customers.create'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createCustomer({ ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) { return fail(c, e, 'Failed to create customer') }
  })
  .get('/:id', requirePermission('customers.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getCustomer(c.req.param('id')))) }
    catch (e) { return fail(c, e, 'Failed to get customer') }
  })
  .patch('/:id', requirePermission('customers.update'), zValidator('json', UpdateSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateCustomer(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id }))) }
    catch (e) { return fail(c, e, 'Failed to update customer') }
  })
  .post('/:id/block', requirePermission('customers.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.setStatus(c.req.param('id'), 'BLOCKED', c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to block customer') }
  })
  .post('/:id/unblock', requirePermission('customers.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.setStatus(c.req.param('id'), 'ACTIVE', c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to unblock customer') }
  })
  .post('/:id/archive', requirePermission('customers.update'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.setStatus(c.req.param('id'), 'ARCHIVED', c.get('user')?.id))) }
    catch (e) { return fail(c, e, 'Failed to archive customer') }
  })

  // ── Addresses ───────────────────────────────────────────────────────────────────
  .get('/:id/addresses', requirePermission('customers.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listAddresses(c.req.param('id')))) }
    catch (e) { return fail(c, e, 'Failed to list addresses') }
  })
  .post('/:id/addresses', requirePermission('customers.update'), zValidator('json', AddressSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.addAddress(c.req.param('id'), c.req.valid('json'))), 201) }
    catch (e) { return fail(c, e, 'Failed to add address') }
  })

  // ── Wallet ──────────────────────────────────────────────────────────────────────
  .get('/:id/wallet', requirePermission('customers.wallet'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getWallet(c.req.param('id')))) }
    catch (e) { return fail(c, e, 'Failed to get wallet') }
  })
  .post('/:id/wallet/credit', requirePermission('customers.wallet'), zValidator('json', AmountSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.creditWallet(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) { return fail(c, e, 'Failed to credit wallet') }
  })
  .post('/:id/wallet/debit', requirePermission('customers.wallet'), zValidator('json', AmountSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.debitWallet(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) { return fail(c, e, 'Failed to debit wallet') }
  })

  // ── Loyalty ─────────────────────────────────────────────────────────────────────
  .get('/:id/loyalty', requirePermission('customers.loyalty'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getLoyalty(c.req.param('id')))) }
    catch (e) { return fail(c, e, 'Failed to get loyalty') }
  })
  .post('/:id/loyalty/earn', requirePermission('customers.loyalty'), zValidator('json', PointsSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.earnPoints(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) { return fail(c, e, 'Failed to earn points') }
  })
  .post('/:id/loyalty/redeem', requirePermission('customers.loyalty'), zValidator('json', PointsSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.redeemPoints(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) { return fail(c, e, 'Failed to redeem points') }
  })
  .post('/:id/loyalty/reverse', requirePermission('customers.loyalty'), zValidator('json', PointsSchema), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.reversePoints(c.req.param('id'), { ...c.req.valid('json'), actorId: c.get('user')?.id })), 201) }
    catch (e) { return fail(c, e, 'Failed to reverse points') }
  })

  // ── Purchase history ─────────────────────────────────────────────────────────────
  .get('/:id/history', requirePermission('customers.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getPurchaseHistory(c.req.param('id')))) }
    catch (e) { return fail(c, e, 'Failed to get purchase history') }
  })

export default app
