import { describe, it, expect, beforeEach } from 'vitest'
import { organization, subscriptionPlan, subscription, subscriptionInvoice, featureFlag } from '@repo/database/src/schema'
import { createSubscriptionsRepository } from '../../apps/worker/repositories/subscriptions.repository'
import {
  enforceSubscriptionActive, enforceLimit, requireFeature, isFeatureEnabled,
} from '../../apps/worker/utils/plan-limits'
import { evaluateSubscription, activateSubscription } from '../../apps/worker/utils/subscription-lifecycle'
import { processBillingWebhook } from '../../apps/worker/services/v1/billing.service'
import { verifyWebhook } from '../../apps/worker/services/v1/billing-providers'
import {
  createTestDb, makeOrg, makePlan, makeSubscription, makeInvoice, DAY, type TestDb,
} from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'
const now = Date.now()

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
  await db.insert(subscriptionPlan).values([
    makePlan('plan_free', 'Free', { price: 0, limitProducts: 100 }),
    makePlan('plan_business', 'Business', { price: 499000, limitProducts: 10000, featureFlags: '{"funnels":true,"advanced_reports":true}' }),
  ])
})

// ─── Invoice / subscription isolation ───────────────────────────────────────────

describe('Billing isolation', () => {
  beforeEach(async () => {
    await db.insert(subscription).values([
      makeSubscription('sub-a', ORG_A, 'plan_free'),
      makeSubscription('sub-b', ORG_B, 'plan_free'),
    ])
    await db.insert(subscriptionInvoice).values([
      makeInvoice('inv-a1', ORG_A, 'sub-a', 'plan_business'),
      makeInvoice('inv-b1', ORG_B, 'sub-b', 'plan_business'),
    ])
  })

  it('repo A sees only org A invoices', async () => {
    const repo = createSubscriptionsRepository(db as any, ORG_A)
    const rows = await repo.findInvoices()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_A)
  })

  it('findInvoiceById from org A cannot see org B invoice', async () => {
    const repo = createSubscriptionsRepository(db as any, ORG_A)
    expect(await repo.findInvoiceById('inv-b1')).toBeNull()
  })

  it('findSubscription scoped to org', async () => {
    const repoA = createSubscriptionsRepository(db as any, ORG_A)
    const repoB = createSubscriptionsRepository(db as any, ORG_B)
    expect((await repoA.findSubscription())?.id).toBe('sub-a')
    expect((await repoB.findSubscription())?.id).toBe('sub-b')
  })

  it('updateSubscription from org A does not affect org B', async () => {
    const repoA = createSubscriptionsRepository(db as any, ORG_A)
    const repoB = createSubscriptionsRepository(db as any, ORG_B)
    await repoA.updateSubscription({ status: 'CANCELLED' })
    expect((await repoB.findSubscription())?.status).toBe('TRIAL')
  })
})

// ─── Plan limit + status enforcement ────────────────────────────────────────────

describe('Plan enforcement', () => {
  it('enforceLimit throws 422 when at limit', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free'))
    await expect(enforceLimit(db as any, ORG_A, 'limitProducts', 100)).rejects.toMatchObject({ status: 422 })
  })

  it('enforceLimit passes below limit', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free'))
    await expect(enforceLimit(db as any, ORG_A, 'limitProducts', 99)).resolves.toBeUndefined()
  })

  it('enforceSubscriptionActive throws 402 when EXPIRED', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'EXPIRED' }))
    await expect(enforceSubscriptionActive(db as any, ORG_A)).rejects.toMatchObject({ status: 402 })
  })

  it('enforceSubscriptionActive throws 402 when SUSPENDED', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'SUSPENDED' }))
    await expect(enforceSubscriptionActive(db as any, ORG_A)).rejects.toMatchObject({ status: 402 })
  })

  it('enforceSubscriptionActive passes for TRIAL and ACTIVE', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'TRIAL' }))
    await expect(enforceSubscriptionActive(db as any, ORG_A)).resolves.toBeUndefined()
  })

  it('no subscription = allowed (implicit trial)', async () => {
    await expect(enforceSubscriptionActive(db as any, ORG_A)).resolves.toBeUndefined()
    await expect(enforceLimit(db as any, ORG_A, 'limitProducts', 9999)).resolves.toBeUndefined()
  })
})

// ─── Feature flags ──────────────────────────────────────────────────────────────

describe('Feature flags', () => {
  it('requireFeature passes when plan enables it', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_business'))
    await expect(requireFeature(db as any, ORG_A, 'funnels')).resolves.toBeUndefined()
  })

  it('requireFeature throws 403 when plan lacks it', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free'))
    await expect(requireFeature(db as any, ORG_A, 'funnels')).rejects.toMatchObject({ status: 403 })
  })

  it('per-org override wins over plan default', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free'))
    await db.insert(featureFlag).values({ id: 'ff-a', organizationId: ORG_A, flag: 'funnels', enabled: true, updatedAt: new Date(now) })
    expect(await isFeatureEnabled(db as any, ORG_A, 'funnels')).toBe(true)
  })

  it('flags are org-scoped — override in A does not affect B', async () => {
    await db.insert(subscription).values([
      makeSubscription('sub-a', ORG_A, 'plan_free'),
      makeSubscription('sub-b', ORG_B, 'plan_free'),
    ])
    await db.insert(featureFlag).values({ id: 'ff-a', organizationId: ORG_A, flag: 'funnels', enabled: true, updatedAt: new Date(now) })
    expect(await isFeatureEnabled(db as any, ORG_A, 'funnels')).toBe(true)
    expect(await isFeatureEnabled(db as any, ORG_B, 'funnels')).toBe(false)
  })
})

// ─── Lifecycle ──────────────────────────────────────────────────────────────────

describe('Subscription lifecycle', () => {
  it('TRIAL past trialEndsAt transitions to EXPIRED', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'TRIAL', trialEndsAt: new Date(now - DAY) }))
    const sub = await evaluateSubscription(db as any, ORG_A, new Date(now))
    expect(sub?.status).toBe('EXPIRED')
    const [org] = await db.select().from(organization).where((await import('drizzle-orm')).eq(organization.id, ORG_A))
    expect(org.status).toBe('EXPIRED')
  })

  it('TRIAL within trial stays TRIAL', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'TRIAL', trialEndsAt: new Date(now + DAY) }))
    const sub = await evaluateSubscription(db as any, ORG_A, new Date(now))
    expect(sub?.status).toBe('TRIAL')
  })

  it('EXPIRED past graceEndsAt transitions to SUSPENDED', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'EXPIRED', graceEndsAt: new Date(now - DAY) }))
    const sub = await evaluateSubscription(db as any, ORG_A, new Date(now))
    expect(sub?.status).toBe('SUSPENDED')
  })

  it('ACTIVE past currentPeriodEnd transitions to EXPIRED with grace', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'ACTIVE', currentPeriodEnd: new Date(now - DAY) }))
    const sub = await evaluateSubscription(db as any, ORG_A, new Date(now))
    expect(sub?.status).toBe('EXPIRED')
    expect(sub?.graceEndsAt).toBeTruthy()
  })

  it('activateSubscription sets ACTIVE with a period window', async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'TRIAL' }))
    await activateSubscription(db as any, ORG_A, 'plan_business', 'MONTHLY', new Date(now))
    const [sub] = await db.select().from(subscription).where((await import('drizzle-orm')).eq(subscription.organizationId, ORG_A))
    expect(sub.status).toBe('ACTIVE')
    expect(sub.planId).toBe('plan_business')
    expect(sub.currentPeriodEnd).toBeTruthy()
  })
})

// ─── Webhook: verified + idempotent ─────────────────────────────────────────────

describe('Billing webhook', () => {
  beforeEach(async () => {
    await db.insert(subscription).values(makeSubscription('sub-a', ORG_A, 'plan_free', { status: 'TRIAL', trialEndsAt: new Date(now + DAY) }))
    await db.insert(subscriptionInvoice).values(makeInvoice('inv-a1', ORG_A, 'sub-a', 'plan_business', { provider: 'bKash' }))
  })

  const payload = { invoiceId: 'inv-a1', providerRef: 'TXN123', status: 'success' as const, idempotencyKey: 'evt-1' }

  it('success marks invoice PAID and activates subscription', async () => {
    const res = await processBillingWebhook(db as any, 'bKash', payload)
    expect(res.alreadyProcessed).toBe(false)
    const repo = createSubscriptionsRepository(db as any, ORG_A)
    expect((await repo.findInvoiceById('inv-a1'))?.status).toBe('PAID')
    expect((await repo.findSubscription())?.status).toBe('ACTIVE')
    expect((await repo.findSubscription())?.planId).toBe('plan_business')
  })

  it('duplicate event for paid invoice is a no-op (idempotent)', async () => {
    await processBillingWebhook(db as any, 'bKash', payload)
    const res = await processBillingWebhook(db as any, 'bKash', { ...payload, idempotencyKey: 'evt-2' })
    expect(res.alreadyProcessed).toBe(true)
  })

  it('failed event marks invoice FAILED, leaves subscription untouched', async () => {
    const res = await processBillingWebhook(db as any, 'bKash', { ...payload, status: 'failed' })
    expect(res.alreadyProcessed).toBe(false)
    const repo = createSubscriptionsRepository(db as any, ORG_A)
    expect((await repo.findInvoiceById('inv-a1'))?.status).toBe('FAILED')
    expect((await repo.findSubscription())?.status).toBe('TRIAL')
  })

  it('rejects invalid signature when a secret is configured (401)', async () => {
    await expect(processBillingWebhook(db as any, 'bKash', payload, 'secret-key')).rejects.toMatchObject({ status: 401 })
  })

  it('accepts a correctly signed payload', async () => {
    const signature = `inv-a1:TXN123:success:secret-key`
    const res = await processBillingWebhook(db as any, 'bKash', { ...payload, signature }, 'secret-key')
    expect(res.alreadyProcessed).toBe(false)
  })

  it('provider mismatch rejected (400)', async () => {
    await expect(processBillingWebhook(db as any, 'Nagad', payload)).rejects.toMatchObject({ status: 400 })
  })

  it('verifyWebhook rejects malformed payload', () => {
    expect(verifyWebhook({ invoiceId: 'x' } as any)).toBe(false)
  })
})
