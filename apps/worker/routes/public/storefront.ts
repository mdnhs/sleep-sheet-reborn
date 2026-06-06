import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createPublicStorefrontService } from '../../services/public/storefront.service'
import { createOrderPaymentService, handleOrderPaymentWebhook } from '../../services/public/payments.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CheckoutSchema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  customer: z.object({
    name: z.string().min(1), phone: z.string().min(1), email: z.string().email().optional(),
    address: z.string().min(1), area: z.string().optional(), city: z.string().min(1),
  }),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD', 'SSLCOMMERZ', 'BANK', 'WALLET']).optional(),
  notes: z.string().optional(),
  funnelId: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

// Public storefront — no authentication; tenant resolved from subdomain.
function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createPublicStorefrontService(c.get('db'), tenant.id)
}
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}
const noTenant = (c: any) => c.json(err('TENANT_NOT_FOUND', 'Storefront not found'), 404)

const app = new Hono<HonoEnv>()
  .get('/storefront', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.getStorefront())) } catch (e) { return fail(c, e, 'Failed to load storefront') }
  })
  .get('/products', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    const limit = Math.min(Number(c.req.query('limit') ?? 24) || 24, 100)
    try { return c.json(ok(await s.listProducts(limit))) } catch (e) { return fail(c, e, 'Failed to load products') }
  })
  .get('/catalog', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    const limit = Number(c.req.query('limit') ?? 24) || 24
    const offset = Number(c.req.query('offset') ?? 0) || 0
    try {
      return c.json(ok(await s.browseProducts({
        search: c.req.query('search'), categorySlug: c.req.query('category'), limit, offset,
      })))
    } catch (e) { return fail(c, e, 'Failed to load catalog') }
  })
  .get('/categories', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.listCategories())) } catch (e) { return fail(c, e, 'Failed to load categories') }
  })
  .get('/products/:slug', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.getProduct(c.req.param('slug')))) } catch (e) { return fail(c, e, 'Failed to load product') }
  })
  .get('/pages/:slug', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.getPage(c.req.param('slug')))) } catch (e) { return fail(c, e, 'Failed to load page') }
  })
  .get('/blog', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.listBlog())) } catch (e) { return fail(c, e, 'Failed to load blog') }
  })
  .get('/blog/:slug', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.getPost(c.req.param('slug')))) } catch (e) { return fail(c, e, 'Failed to load post') }
  })
  .get('/funnels/:slug', async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.getFunnel(c.req.param('slug')))) } catch (e) { return fail(c, e, 'Failed to load funnel') }
  })
  .post('/funnels/:id/track', zValidator('json', z.object({
    stepId: z.string().optional(), visitorId: z.string().optional(),
    utmSource: z.string().optional(), utmMedium: z.string().optional(), utmCampaign: z.string().optional(),
  })), async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.trackFunnelVisit(c.req.param('id'), c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to track visit') }
  })
  .post('/checkout', zValidator('json', CheckoutSchema), async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.createOrder(c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to place order') }
  })
  .post('/payments/initiate', zValidator('json', z.object({ orderId: z.string().min(1), provider: z.enum(['bKash', 'Nagad', 'SSLCommerz']) })), async (c) => {
    const tenant = c.get('tenant'); if (!tenant) return noTenant(c)
    const body = c.req.valid('json')
    try { return c.json(ok(await createOrderPaymentService(c.get('db'), tenant.id).initiate(body.orderId, body.provider)), 201) }
    catch (e) { return fail(c, e, 'Failed to initiate payment') }
  })
  // Inbound provider webhook (unscoped — org resolved from the payment). Never trusts client.
  .post('/payments/:provider/webhook', async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const secret = (c.env as { PAYMENT_WEBHOOK_SECRET?: string }).PAYMENT_WEBHOOK_SECRET
    try { return c.json(ok(await handleOrderPaymentWebhook(c.get('db'), c.req.param('provider'), body, secret))) }
    catch (e) { return fail(c, e, 'Failed to process webhook') }
  })

export default app
