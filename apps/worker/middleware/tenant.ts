import { createMiddleware } from 'hono/factory'
import { createDb, setWorkerD1 } from '@repo/database'
import { eq } from 'drizzle-orm'
import { organization } from '@repo/database/schema'
import type { HonoEnv } from '../src/types'

// Extracts org slug from subdomain: abc.platform.com → 'abc'
function extractSlug(host: string): string | null {
  const hostname = host.split(':')[0] // strip port
  const parts = hostname.split('.')
  // Require at least 3 parts: slug.domain.tld
  // Dev: localhost or 127.0.0.1 → no tenant (platform context)
  if (parts.length < 3 || hostname === 'localhost') return null
  return parts[0] ?? null
}

export const tenantMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const db = createDb(c.env.DB)
  c.set('db', db)
  // Expose the D1 binding to the legacy custom ORM (client.ts) which can't
  // use getCloudflareContext() inside a plain Worker.
  setWorkerD1(c.env.DB)

  const host = c.req.header('host') ?? ''
  const slug = extractSlug(host)

  if (!slug) {
    c.set('tenant', null)
    return await next()
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  })

  if (!org) {
    return c.json({ error: 'Organization not found' }, 404)
  }

  if (org.status === 'SUSPENDED' || org.status === 'CANCELLED') {
    return c.json({ error: 'Organization is not active' }, 403)
  }

  c.set('tenant', org)
  await next()
})
