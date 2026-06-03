import { createMiddleware } from 'hono/factory'
import { hasPermission } from '@repo/permissions'
import type { OrgRole, OrgPermission } from '@repo/permissions'
import { validateWorkerEnv } from '../src/env'
import type { HonoEnv } from '../src/types'

/** Guards org routes to users with any of the given org roles.
 *  Requires sessionMiddleware to run first (orgRole set on context).
 *  Returns 403 — role check does not leak tenant existence. */
export const requireOrgRole = (...roles: OrgRole[]) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user')
    const tenant = c.get('tenant')
    const orgRole = c.get('orgRole')

    if (!user || !tenant) return c.json({ error: 'Unauthorized' }, 401)
    if (!orgRole || !roles.includes(orgRole)) return c.json({ error: 'Forbidden' }, 403)

    await next()
  })

/** Guards a route by permission. Derives allowed roles from the permission catalog.
 *  Requires sessionMiddleware to run first. */
export const requirePermission = (permission: OrgPermission) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user')
    const tenant = c.get('tenant')
    const orgRole = c.get('orgRole')

    if (!user || !tenant) return c.json({ error: 'Unauthorized' }, 401)
    if (!orgRole || !hasPermission(orgRole, permission)) return c.json({ error: 'Forbidden' }, 403)

    await next()
  })

/** Guards platform-only routes to SUPER_ADMIN.
 *  Does NOT require tenant context — platform scope is unscoped. */
export const requirePlatformAdmin = createMiddleware<HonoEnv>(async (c, next) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { SUPER_ADMIN_EMAIL } = validateWorkerEnv(c.env)
  if (user.email !== SUPER_ADMIN_EMAIL) return c.json({ error: 'Forbidden' }, 403)

  await next()
})

/** Require authenticated user (any role). */
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  if (!c.get('user')) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})

// Backward-compat aliases
/** @deprecated Use requireOrgRole('OWNER', 'ADMIN') instead */
export const requireAdmin = requireOrgRole('OWNER', 'ADMIN')
/** @deprecated Use requireOrgRole(...roles) instead */
export const requireRole = (...roles: OrgRole[]) => requireOrgRole(...roles)
