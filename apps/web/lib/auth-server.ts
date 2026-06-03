import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createDb } from '@repo/database'
import { createAuth } from '@repo/auth'
import { headers } from 'next/headers'
import { env } from '@/env'

async function getServerAuth() {
  const { env: cfEnv } = await getCloudflareContext({ async: true })
  const db = createDb(cfEnv.DB as D1Database)
  return createAuth(db, {
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.TRUSTED_ORIGINS?.split(',').map((s) => s.trim()),
  })
}

export async function getCurrentSession() {
  const auth = await getServerAuth()
  const h = await headers()
  return auth.api.getSession({ headers: h })
}
