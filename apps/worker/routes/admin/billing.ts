import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePlatformAdmin } from '../../middleware/rbac'
import { createPlatformBillingService } from '../../services/v1/platform-billing.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const PlanSchema = z.object({
  name: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  price: z.number().int().min(0),
  limitUsers: z.number().int().min(0),
  limitOutlets: z.number().int().min(0),
  limitWarehouses: z.number().int().min(0),
  limitProducts: z.number().int().min(0),
  limitOrdersPerMonth: z.number().int().min(0),
  limitThemes: z.number().int().min(0),
  limitFunnels: z.number().int().min(0),
  featureFlags: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

const StatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']) })
const ActivateSchema = z.object({ planId: z.string().min(1) })

function svc(c: any) {
  return createPlatformBillingService(c.get('db'))
}

const app = new Hono<HonoEnv>()
  .use('*', requirePlatformAdmin)

  .get('/plans', async (c) => {
    try { return c.json(ok(await svc(c).listPlans())) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to list plans'), 500) }
  })

  .post('/plans', zValidator('json', PlanSchema), async (c) => {
    try { return c.json(ok(await svc(c).createPlan(c.req.valid('json'))), 201) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create plan'), 500)
    }
  })

  .patch('/plans/:id', zValidator('json', PlanSchema.partial()), async (c) => {
    try { return c.json(ok(await svc(c).updatePlan(c.req.param('id'), c.req.valid('json')))) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update plan'), 500)
    }
  })

  .get('/subscriptions', async (c) => {
    try { return c.json(ok(await svc(c).listSubscriptions())) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to list subscriptions'), 500) }
  })

  .get('/subscriptions/:orgId/invoices', async (c) => {
    try { return c.json(ok(await svc(c).listInvoices(c.req.param('orgId')))) }
    catch { return c.json(err('INTERNAL_ERROR', 'Failed to list invoices'), 500) }
  })

  .post('/subscriptions/:orgId/status', zValidator('json', StatusSchema), async (c) => {
    try { return c.json(ok(await svc(c).setOrgSubscriptionStatus(c.req.param('orgId'), c.req.valid('json').status, c.get('user')?.id))) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update status'), 500)
    }
  })

  .post('/subscriptions/:orgId/activate', zValidator('json', ActivateSchema), async (c) => {
    try { return c.json(ok(await svc(c).manualActivate(c.req.param('orgId'), c.req.valid('json').planId, c.get('user')?.id))) }
    catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to activate'), 500)
    }
  })

export default app
