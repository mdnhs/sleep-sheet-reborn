
import { createMiddleware } from 'hono/factory'
import { getCookie, deleteCookie } from 'hono/cookie'

import jwt from 'jsonwebtoken'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { AUTH_COOKIE } from '@/features/auth/constants'


type CustomContext = {
  Variables: {
    db: typeof db
    user: {
      id: string
      email: string
      name: string
      role: string
      phone: string | null
      address: string | null
    } | null
  }
}

export const sessionMiddleware = createMiddleware<CustomContext>(async (c, next) => {
  const token = getCookie(c, AUTH_COOKIE)

  c.set('db', db)

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
