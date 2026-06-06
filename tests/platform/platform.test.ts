import { describe, it, expect, beforeEach } from 'vitest'
import { organization, subscriptionPlan, subscription, order, posSale, theme, funnelTemplate } from '@repo/database/src/schema'
import { createPlatformAdminService } from '../../apps/worker/services/v1/platform-admin.service'
import { createTestDb, makeOrg, makePlan, makeSub, makeOrder, makePos, type TestDb } from './setup'

let db: TestDb
const svc = () => createPlatformAdminService(db as any)

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([
    makeOrg('o1', 'one', 'ACTIVE'),
    makeOrg('o2', 'two', 'TRIAL'),
    makeOrg('o3', 'three', 'CANCELLED'),
  ])
  await db.insert(subscriptionPlan).values([makePlan('plan_m', 99900, 'MONTHLY'), makePlan('plan_y', 1200000, 'YEARLY')])
  await db.insert(subscription).values([
    makeSub('s1', 'o1', 'plan_m', 'ACTIVE'),
    makeSub('s2', 'o2', 'plan_m', 'TRIAL'),
    makeSub('s3', 'o3', 'plan_y', 'CANCELLED'),
  ])
})

// ─── Organizations ────────────────────────────────────────────────────────────────

describe('Organization administration', () => {
  it('lists all organizations with subscription + plan', async () => {
    const rows = await svc().listOrganizations()
    expect(rows).toHaveLength(3)
    expect(rows.find(r => r.id === 'o1')!.subscriptionStatus).toBe('ACTIVE')
  })

  it('suspend sets SUSPENDED and writes an audit row', async () => {
    const res = await svc().suspendOrg('o1', 'admin')
    expect(res.status).toBe('SUSPENDED')
    const [org] = await db.select().from(organization).where(eqId('o1'))
    expect(org.status).toBe('SUSPENDED')
  })

  it('reactivate sets ACTIVE', async () => {
    await svc().suspendOrg('o1')
    await svc().reactivateOrg('o1')
    const [org] = await db.select().from(organization).where(eqId('o1'))
    expect(org.status).toBe('ACTIVE')
  })

  it('suspend unknown org throws 404', async () => {
    await expect(svc().suspendOrg('nope')).rejects.toThrow(/not found/i)
  })
})

// ─── Feature flags ────────────────────────────────────────────────────────────────

describe('Feature flag overrides', () => {
  it('lists the known flags (disabled by default on an empty plan)', async () => {
    const { flags } = await svc().getOrgFeatureFlags('o1')
    expect(flags.map(f => f.flag)).toContain('funnels')
    expect(flags.every(f => f.enabled === false && f.overridden === false)).toBe(true)
  })

  it('enabling an override flips the effective flag', async () => {
    await svc().setOrgFeatureFlag('o1', 'funnels', true, 'admin')
    const { flags } = await svc().getOrgFeatureFlags('o1')
    const funnels = flags.find(f => f.flag === 'funnels')!
    expect(funnels.enabled).toBe(true)
    expect(funnels.overridden).toBe(true)
  })

  it('rejects unknown flag and unknown org', async () => {
    await expect(svc().setOrgFeatureFlag('o1', 'teleport', true)).rejects.toThrow(/unknown feature flag/i)
    await expect(svc().setOrgFeatureFlag('nope', 'funnels', true)).rejects.toThrow(/not found/i)
  })

  it('flag overrides are org-scoped', async () => {
    await svc().setOrgFeatureFlag('o1', 'apps', true)
    const { flags } = await svc().getOrgFeatureFlags('o2')
    expect(flags.find(f => f.flag === 'apps')!.enabled).toBe(false)
  })
})

// ─── Analytics ──────────────────────────────────────────────────────────────────────

describe('SaaS analytics', () => {
  it('computes MRR/ARR, org counts, churn, and GMV', async () => {
    await db.insert(order).values([makeOrder('ord1', 'o1', 5000), makeOrder('ord2', 'o2', 3000)])
    await db.insert(posSale).values([makePos('p1', 'o1', 2000, 'COMPLETED'), makePos('p2', 'o1', 999, 'DRAFT')])

    const a = await svc().getAnalytics()
    expect(a.totalOrgs).toBe(3)
    expect(a.activeOrgs).toBe(1)
    expect(a.trialOrgs).toBe(1)
    expect(a.cancelledOrgs).toBe(1)
    // only o1 has an ACTIVE subscription on a MONTHLY 99900 plan
    expect(a.mrr).toBe(99900)
    expect(a.arr).toBe(99900 * 12)
    // GMV = orders (5000+3000) + completed POS (2000); DRAFT excluded
    expect(a.platformGmv).toBe(10000)
    expect(a.churnRate).toBe(Math.round((1 / 3) * 10000) / 100)
  })

  it('normalizes a YEARLY active plan into monthly MRR', async () => {
    // make o3 active on the yearly plan
    await svc().reactivateOrg('o3')
    await db.update(subscription).set({ status: 'ACTIVE' }).where(eqSubOrg('o3'))
    const a = await svc().getAnalytics()
    // o1 monthly 99900 + o3 yearly 1200000/12 = 100000
    expect(a.mrr).toBe(99900 + 100000)
  })
})

// ─── Marketplace management ───────────────────────────────────────────────────────────

describe('Marketplace catalog management', () => {
  it('creates a theme, rejects duplicate slug, toggles status, adds version', async () => {
    const t = await svc().createTheme({ name: 'Nova', slug: 'nova', type: 'PREMIUM', price: 4900 })
    expect(t.type).toBe('PREMIUM')
    await expect(svc().createTheme({ name: 'Nova2', slug: 'nova' })).rejects.toThrow(/already exists/)
    await svc().setThemeStatus(t.id, 'INACTIVE')
    const [row] = await db.select().from(theme).where(eqThemeId(t.id))
    expect(row.status).toBe('INACTIVE')
    const v = await svc().addThemeVersion(t.id, { version: '1.0.0', r2Key: 'themes/nova/1.0.0.zip' })
    expect(v.version).toBe('1.0.0')
  })

  it('creates and deprecates a funnel template', async () => {
    const t = await svc().createFunnelTemplate({ name: 'Flash', type: 'BUNDLE', price: 0 })
    await svc().setFunnelTemplateStatus(t.id, 'INACTIVE')
    const [row] = await db.select().from(funnelTemplate).where(eqFtId(t.id))
    expect(row.status).toBe('INACTIVE')
  })
})

// ─── helpers ──────────────────────────────────────────────────────────────────────
import { eq } from 'drizzle-orm'
function eqId(id: string) { return eq(organization.id, id) }
function eqSubOrg(orgId: string) { return eq(subscription.organizationId, orgId) }
function eqThemeId(id: string) { return eq(theme.id, id) }
function eqFtId(id: string) { return eq(funnelTemplate.id, id) }
