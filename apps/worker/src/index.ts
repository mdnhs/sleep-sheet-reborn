import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from '@repo/auth'
import { createDb } from '@repo/database'
import { validateWorkerEnv } from './env'
import { tenantMiddleware } from '../middleware/tenant'
import { sessionMiddleware } from '../middleware/session'
import v1 from '../routes/v1/index'
import admin from '../routes/admin/index'
import { err } from '../utils/response'
import { isServiceError } from '../utils/service-error'
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
  .route('/v1', v1)
  .route('/admin', admin)

// Consistent error envelope for uncaught errors + unknown routes
app.onError((e, c) => {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  console.error('Unhandled error:', e)
  return c.json(err('INTERNAL_ERROR', 'An unexpected error occurred'), 500)
})
app.notFound((c) => c.json(err('NOT_FOUND', 'Resource not found'), 404))

export type AppType = typeof routes
export default { fetch: app.fetch }
