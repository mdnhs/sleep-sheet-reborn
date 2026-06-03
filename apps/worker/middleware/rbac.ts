import { createMiddleware } from 'hono/factory'
import { createAuth } from '@repo/auth'
import { createDb } from '@repo/database'
import { validateWorkerEnv } from '../src/env'
import type { HonoEnv } from '../src/types'

type OrgRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'INVENTORY_MANAGER' | 'PURCHASE_MANAGER' | 'CASHIER' | 'DELIVERY_MANAGER' | 'EMPLOYEE'

/** Guards org routes to users with any of the given org roles.
 *  Run after tenantMiddleware + sessionMiddleware.
 *  Returns 403 (not 404) — role check doesn't leak tenant existence. */
export const requireOrgRole = (...roles: OrgRole[]) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user')
    const tenant = c.get('tenant')

    if (!user || !tenant) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const workerEnv = validateWorkerEnv(c.env)
    const db = c.get('db') ?? createDb(c.env.DB)
    const auth = createAuth(db, {
      secret: workerEnv.BETTER_AUTH_SECRET,
      trustedOrigins: workerEnv.TRUSTED_ORIGINS.split(',').map((s) => s.trim()),
    })

    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    const orgMember = await auth.api.getActiveMember({
      headers: c.req.raw.headers,
    }).catch(() => null)

    if (!orgMember || !roles.includes((orgMember.role as OrgRole))) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await next()
  })

/** Guards platform-only routes to SUPER_ADMIN.
 *  Does NOT require tenant context — platform scope is unscoped. */
export const requirePlatformAdmin = createMiddleware<HonoEnv>(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const { SUPER_ADMIN_EMAIL } = validateWorkerEnv(c.env)
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
})

/** Require authenticated user (any role). */
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

// Backward-compat aliases for existing route files
/** @deprecated Use requireOrgRole('OWNER', 'ADMIN') instead */
export const requireAdmin = requireOrgRole('OWNER', 'ADMIN')
/** @deprecated Use requireOrgRole(...roles) instead */
export const requireRole = (...roles: OrgRole[]) => requireOrgRole(...roles)
