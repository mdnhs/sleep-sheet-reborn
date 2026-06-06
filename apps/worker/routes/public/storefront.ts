import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createPublicStorefrontService } from '../../services/public/storefront.service'
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
  .post('/checkout', zValidator('json', CheckoutSchema), async (c) => {
    const s = svc(c); if (!s) return noTenant(c)
    try { return c.json(ok(await s.createOrder(c.req.valid('json'))), 201) } catch (e) { return fail(c, e, 'Failed to place order') }
  })

export default app
