import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from '@repo/auth'
import { createDb } from '@repo/database'
import { validateWorkerEnv } from './env'
import { tenantMiddleware } from '../middleware/tenant'
import { sessionMiddleware } from '../middleware/session'
import authRoutes from '../routes/auth'
import products from '../routes/products'
import dashboard from '../routes/dashboard'
import categories from '../routes/categories'
import reviews from '../routes/reviews'
import cart from '../routes/cart'
import checkout from '../routes/checkout'
import orders from '../routes/orders'
import collections from '../routes/collections'
import testimonials from '../routes/testimonials'
import wishlist from '../routes/wishlist'
import analytics from '../routes/analytics'
import steadfast from '../routes/steadfast'
import settings from '../routes/settings'
import inventory from '../routes/inventory'
import type { HonoEnv } from './types'

const app = new Hono<HonoEnv>().basePath('/api')

app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}))

// 1. Init db + resolve tenant from subdomain on every request
app.use('*', tenantMiddleware)

// 2. Validate env vars
app.use('*', async (c, next) => {
  validateWorkerEnv(c.env)
  await next()
})

// 3. Authenticate user + resolve org membership for the resolved tenant
app.use('*', sessionMiddleware)

// Better Auth handler — intercepts /api/auth/* requests
app.on(['GET', 'POST'], '/auth/*', async (c) => {
  const env = validateWorkerEnv(c.env)
  const db = createDb(c.env.DB)
  const auth = createAuth(db, {
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.TRUSTED_ORIGINS.split(',').map((s) => s.trim()),
    baseURL: new URL(c.req.url).origin,
  })
  return auth.handler(c.req.raw)
})

const routes = app
  .route('/auth', authRoutes)
  .route('/products', products)
  .route('/product', dashboard)
  .route('/categories', categories)
  .route('/reviews', reviews)
  .route('/cart', cart)
  .route('/checkout', checkout)
  .route('/orders', orders)
  .route('/collection', collections)
  .route('/testimonials', testimonials)
  .route('/wishlist', wishlist)
  .route('/analytics', analytics)
  .route('/steadfast', steadfast)
  .route('/settings', settings)
  .route('/inventory', inventory)

export type AppType = typeof routes
export default { fetch: app.fetch }
