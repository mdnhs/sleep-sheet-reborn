import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import type { Database } from '@repo/database'
import * as schema from '@repo/database/schema'

// Business-level org roles (stored in member.role, enforced in RBAC middleware).
// Better Auth's org plugin uses its own 'owner'/'admin'/'member' defaults for
// invitation/membership CRUD permissions — separate from our domain roles.
export type OrgRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'INVENTORY_MANAGER'
  | 'PURCHASE_MANAGER'
  | 'CASHIER'
  | 'DELIVERY_MANAGER'
  | 'EMPLOYEE'

export type AuthOptions = {
  secret?: string
  trustedOrigins?: string[]
  baseURL?: string
}

export function createAuth(db: Database, opts?: AuthOptions) {
  return betterAuth({
    baseURL: opts?.baseURL ?? process.env.BETTER_AUTH_URL ?? process.env.WEB_URL,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        organization: schema.organization,
        member: schema.member,
        invitation: schema.invitation,
      },
    }),
    plugins: [
      organization({
        // sendInvitationEmail is called when an invitation is created
        sendInvitationEmail: async (_data) => {
          // TODO: wire to apps/worker/integrations/email once email is configured
        },
      }),
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        phone: { type: 'string', required: false, defaultValue: null },
        address: { type: 'string', required: false, defaultValue: null },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh daily
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    secret: opts?.secret ?? process.env.BETTER_AUTH_SECRET ?? 'development-secret-change-in-production',
    trustedOrigins: opts?.trustedOrigins ?? (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000').split(','),
  })
}

export type Auth = ReturnType<typeof createAuth>
