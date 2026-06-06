import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createBillingService, processBillingWebhook } from '../../services/v1/billing.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CheckoutSchema = z.object({
  planId: z.string().min(1),
  provider: z.enum(['bKash', 'Nagad', 'SSLCommerz']),
})

const WebhookSchema = z.object({
  invoiceId: z.string().min(1),
  providerRef: z.string().min(1),
  status: z.enum(['success', 'failed']),
  idempotencyKey: z.string().min(1),
  signature: z.string().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createBillingService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  // ── Provider webhooks (no auth — verified + idempotent in the service) ─────────
  .post('/webhooks/:provider', zValidator('json', WebhookSchema), async (c) => {
    const provider = c.req.param('provider')
    const secret = (c.env as any).BILLING_WEBHOOK_SECRET as string | undefined
    try {
      const result = await processBillingWebhook(c.get('db'), provider, c.req.valid('json'), secret)
      return c.json(ok(result))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to process webhook'), 500)
    }
  })

  .get('/subscription', requirePermission('billing.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getSubscription()))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to load subscription'), 500)
    }
  })

  .get('/plans', requirePermission('billing.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listPlans()))
    } catch {
      return c.json(err('INTERNAL_ERROR', 'Failed to load plans'), 500)
    }
  })

  .get('/usage', requirePermission('billing.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getUsage()))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to load usage'), 500)
    }
  })

  .get('/invoices', requirePermission('billing.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listInvoices()))
    } catch {
      return c.json(err('INTERNAL_ERROR', 'Failed to load invoices'), 500)
    }
  })

  .post('/checkout', requirePermission('billing.manage'), zValidator('json', CheckoutSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.createCheckout({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to start checkout'), 500)
    }
  })

  .post('/cancel', requirePermission('billing.manage'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.cancel(c.get('user')?.id)))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to cancel'), 500)
    }
  })

export default app
