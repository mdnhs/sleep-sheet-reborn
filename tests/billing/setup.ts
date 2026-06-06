import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

/** In-memory SQLite with the schema needed for billing tests. */
export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT, metadata TEXT, customDomain TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'TRIAL',
      currency TEXT NOT NULL DEFAULT 'BDT',
      timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_plan (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      billingCycle TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      limitUsers INTEGER NOT NULL DEFAULT 5,
      limitOutlets INTEGER NOT NULL DEFAULT 1,
      limitWarehouses INTEGER NOT NULL DEFAULT 1,
      limitProducts INTEGER NOT NULL DEFAULT 100,
      limitOrdersPerMonth INTEGER NOT NULL DEFAULT 500,
      limitThemes INTEGER NOT NULL DEFAULT 1,
      limitFunnels INTEGER NOT NULL DEFAULT 3,
      featureFlags TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
      planId TEXT NOT NULL REFERENCES subscription_plan(id),
      status TEXT NOT NULL DEFAULT 'TRIAL',
      trialEndsAt INTEGER, currentPeriodStart INTEGER, currentPeriodEnd INTEGER, graceEndsAt INTEGER,
      autoRenew INTEGER NOT NULL DEFAULT 1,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_invoice (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      subscriptionId TEXT NOT NULL REFERENCES subscription(id),
      planId TEXT REFERENCES subscription_plan(id),
      invoiceNumber TEXT,
      provider TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      providerRef TEXT,
      idempotencyKey TEXT,
      periodStart INTEGER, periodEnd INTEGER, paidAt INTEGER,
      createdAt INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS subscription_invoice_idempotency_idx ON subscription_invoice(idempotencyKey);

    CREATE TABLE IF NOT EXISTS feature_flag (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      flag TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      updatedAt INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS feature_flag_org_flag_idx ON feature_flag(organizationId, flag);

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      entityType TEXT NOT NULL, entityId TEXT NOT NULL, action TEXT NOT NULL,
      actorId TEXT, changes TEXT, createdAt INTEGER NOT NULL
    );
  `)

  return db
}

const now = Date.now()
const D = (ms: number) => new Date(now + ms)
const DAY = 24 * 60 * 60 * 1000

export function makeOrg(id: string, slug: string) {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status: 'TRIAL' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D(0), updatedAt: D(0) }
}

export function makePlan(id: string, name: string, opts?: { price?: number; limitProducts?: number; featureFlags?: string; billingCycle?: 'MONTHLY' | 'YEARLY' }) {
  return {
    id, name, billingCycle: opts?.billingCycle ?? 'MONTHLY' as const, price: opts?.price ?? 0,
    limitUsers: 5, limitOutlets: 1, limitWarehouses: 1, limitProducts: opts?.limitProducts ?? 100,
    limitOrdersPerMonth: 500, limitThemes: 1, limitFunnels: 3,
    featureFlags: opts?.featureFlags ?? null, status: 'ACTIVE' as const, createdAt: D(0), updatedAt: D(0),
  }
}

export function makeSubscription(id: string, orgId: string, planId: string, opts?: {
  status?: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'
  trialEndsAt?: Date | null; currentPeriodEnd?: Date | null; graceEndsAt?: Date | null
}) {
  return {
    id, organizationId: orgId, planId, status: opts?.status ?? 'TRIAL' as const,
    trialEndsAt: opts?.trialEndsAt ?? null, currentPeriodStart: null, currentPeriodEnd: opts?.currentPeriodEnd ?? null,
    graceEndsAt: opts?.graceEndsAt ?? null, autoRenew: true, createdAt: D(0), updatedAt: D(0),
  }
}

export function makeInvoice(id: string, orgId: string, subId: string, planId: string, opts?: { status?: string; provider?: string; amount?: number }) {
  return {
    id, organizationId: orgId, subscriptionId: subId, planId, invoiceNumber: `INV-${id}`,
    provider: opts?.provider ?? 'bKash', amount: opts?.amount ?? 99000, status: (opts?.status ?? 'PENDING') as any,
    providerRef: null, idempotencyKey: null, periodStart: null, periodEnd: null, paidAt: null, createdAt: D(0),
  }
}

export { DAY }
