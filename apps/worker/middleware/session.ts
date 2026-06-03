import { createMiddleware } from 'hono/factory'
import { createAuth } from '@repo/auth'
import { createDb } from '@repo/database'
import type { HonoEnv } from '../src/types'

export const sessionMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const db = c.get('db') ?? createDb(c.env.DB)
  c.set('db', db)

  const auth = createAuth(db)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session?.user) {
    c.set('user', null)
    return await next()
  }

  const u = session.user as Record<string, unknown>
  c.set('user', {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: u.role as string ?? 'USER',
    phone: u.phone as string | null ?? null,
    address: u.address as string | null ?? null,
  })

  await next()
})
