import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createDb } from '@repo/database'
import { createAuth } from '@repo/auth'
import { headers } from 'next/headers'

async function getServerAuth() {
  const { env } = await getCloudflareContext({ async: true })
  const db = createDb(env.DB as D1Database)
  return createAuth(db)
}

export async function getCurrentSession() {
  const auth = await getServerAuth()
  const h = await headers()
  return auth.api.getSession({ headers: h })
}
