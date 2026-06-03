import { createMiddleware } from 'hono/factory'
import { eq, and } from 'drizzle-orm'
import { createAuth } from '@repo/auth'
import { createDb, member } from '@repo/database'
import { validateWorkerEnv } from '../src/env'
import type { HonoEnv } from '../src/types'
import type { OrgRole } from '@repo/permissions'

export const sessionMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const db = c.get('db') ?? createDb(c.env.DB)
  c.set('db', db)

  const workerEnv = validateWorkerEnv(c.env)
  const auth = createAuth(db, {
    secret: workerEnv.BETTER_AUTH_SECRET,
    trustedOrigins: workerEnv.TRUSTED_ORIGINS.split(',').map((s) => s.trim()),
    baseURL: new URL(c.req.url).origin,
  })
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session?.user) {
    c.set('user', null)
    c.set('orgRole', null)
    return await next()
  }

  const u = session.user as Record<string, unknown>
  c.set('user', {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (u.role as string) ?? 'USER',
    phone: (u.phone as string | null) ?? null,
    address: (u.address as string | null) ?? null,
  })

  // Resolve org membership for the subdomain-resolved tenant.
  // Never use the session's activeOrganizationId — that may differ from the host tenant.
  const tenant = c.get('tenant')
  if (tenant) {
    const orgMember = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, tenant.id),
        eq(member.userId, session.user.id),
      ),
    })
    c.set('orgRole', (orgMember?.role as OrgRole) ?? null)
  } else {
    c.set('orgRole', null)
  }

  await next()
})
