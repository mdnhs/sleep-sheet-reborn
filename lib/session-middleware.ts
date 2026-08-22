
import { createMiddleware } from 'hono/factory'
import { getCookie, deleteCookie } from 'hono/cookie'

import jwt from 'jsonwebtoken'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { AUTH_COOKIE } from '@/features/auth/constants'
import { authenticateApiKey } from '@/lib/api-keys'
import { authenticateOAuthToken } from '@/lib/oauth'


type CustomContext = {
  Variables: {
    db: typeof db
    user: {
      id: string
      email: string
      name: string
      role: string
      permissions: string[]
      landingUrl?: string | null
      phone: string | null
      address: string | null
    } | null
  }
}

export const sessionMiddleware = createMiddleware<CustomContext>(async (c, next) => {
  c.set('db', db)

  // Server-to-server callers send an API key or an OAuth access token
  // instead of a browser session cookie. Checked first — a request with an
  // Authorization header never has a real login cookie anyway, and an
  // invalid credential should fail as "logged out", not silently fall
  // through to the cookie check below.
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim()
    const bearerUser = rawToken.startsWith('mcp_at_')
      ? await authenticateOAuthToken(rawToken)
      : await authenticateApiKey(rawToken)
    c.set('user', bearerUser)
    return await next()
  }

  const token = getCookie(c, AUTH_COOKIE)

  if (!token) {
    c.set('user', null)
    return await next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
      with: { assignedRole: true },
    })

    if (!user) {
      c.set('user', null)
      deleteCookie(c, AUTH_COOKIE, { path: "/" })
      return await next()
    }

    const isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;
    
    c.set('user', { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: isSuperAdmin ? 'ADMIN' : user.role, 
      permissions: user.assignedRole ? user.assignedRole.permissions : [],
      landingUrl: user.assignedRole ? user.assignedRole.landingUrl : null,
      phone: user.phone,
      address: user.address 
    })
  } catch (err) {
    console.error('Invalid token', err)
    c.set('user', null)
    deleteCookie(c, AUTH_COOKIE, { path: "/" })
  }

  await next()
})
