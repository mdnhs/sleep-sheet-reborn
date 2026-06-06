import { describe, it, expect, beforeEach } from 'vitest'
import { organization, funnelTemplate, campaign, funnel, order } from '@repo/database/src/schema'
import { createCampaignsRepository } from '../../apps/worker/repositories/campaigns.repository'
import { createFunnelsRepository } from '../../apps/worker/repositories/funnels.repository'
import { createGrowthService } from '../../apps/worker/services/v1/growth.service'
import { createTestDb, makeOrg, makeTemplate, makeOrder, type TestDb } from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
  await db.insert(funnelTemplate).values([makeTemplate('ft_cod', 'COD'), makeTemplate('ft_single', 'SINGLE')])
})

const svc = (org: string) => createGrowthService(db as any, org)

// ─── Isolation ──────────────────────────────────────────────────────────────────

describe('Growth isolation', () => {
  beforeEach(async () => {
    await svc(ORG_A).createCampaign({ name: 'Eid Sale', slug: 'eid' })
    await svc(ORG_B).createCampaign({ name: 'Eid Sale B', slug: 'eid' })
  })

  it('campaign repo A sees only org A', async () => {
    const repo = createCampaignsRepository(db as any, ORG_A)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_A)
  })

  it('same slug allowed across orgs', async () => {
    const a = await createCampaignsRepository(db as any, ORG_A).findBySlug('eid')
    const b = await createCampaignsRepository(db as any, ORG_B).findBySlug('eid')
    expect(a?.organizationId).toBe(ORG_A)
    expect(b?.organizationId).toBe(ORG_B)
  })

  it('campaign update cross-tenant is a no-op', async () => {
    const a = await createCampaignsRepository(db as any, ORG_A).findBySlug('eid')
    await createCampaignsRepository(db as any, ORG_B).update(a!.id, { name: 'Hacked' })
    expect((await createCampaignsRepository(db as any, ORG_A).findById(a!.id))?.name).toBe('Eid Sale')
  })

  it('funnel findById cross-tenant returns null', async () => {
    const f = await svc(ORG_A).createFunnel({ name: 'F1', slug: 'f1' })
    expect(await createFunnelsRepository(db as any, ORG_B).findById(f.id)).toBeNull()
  })
})

// ─── Campaigns ────────────────────────────────────────────────────────────────────

describe('Campaigns', () => {
  it('slugifies name and rejects duplicate slug in same org', async () => {
    const c = await svc(ORG_A).createCampaign({ name: 'Summer Blast!' })
    expect(c.slug).toBe('summer-blast')
    await expect(svc(ORG_A).createCampaign({ name: 'x', slug: 'summer-blast' })).rejects.toThrow(/already exists/)
  })

  it('rejects duplicate product in campaign', async () => {
    const c = await svc(ORG_A).createCampaign({ name: 'C', slug: 'c' })
    await svc(ORG_A).addCampaignProduct(c.id, 'var-1')
    await expect(svc(ORG_A).addCampaignProduct(c.id, 'var-1')).rejects.toThrow(/already in campaign/)
  })
})

// ─── Funnels ────────────────────────────────────────────────────────────────────

describe('Funnels', () => {
  it('inherits type from template', async () => {
    const f = await svc(ORG_A).createFunnel({ name: 'COD Flow', slug: 'cod', templateId: 'ft_cod' })
    expect(f.type).toBe('COD')
  })
  it('rejects unknown template', async () => {
    await expect(svc(ORG_A).createFunnel({ name: 'X', slug: 'x', templateId: 'nope' })).rejects.toThrow(/template not found/i)
  })
  it('steps auto-position and list ordered', async () => {
    const f = await svc(ORG_A).createFunnel({ name: 'F', slug: 'f' })
    await svc(ORG_A).addStep(f.id, { type: 'LANDING' })
    await svc(ORG_A).addStep(f.id, { type: 'UPSELL' })
    await svc(ORG_A).addStep(f.id, { type: 'CHECKOUT' })
    const detail = await svc(ORG_A).getFunnel(f.id)
    expect(detail.steps.map(s => s.position)).toEqual([0, 1, 2])
    expect(detail.steps.map(s => s.type)).toEqual(['LANDING', 'UPSELL', 'CHECKOUT'])
  })
})

// ─── Attribution + analytics ───────────────────────────────────────────────────────

describe('Attribution & analytics', () => {
  it('tracks a campaign visit and reflects it in stats', async () => {
    const c = await svc(ORG_A).createCampaign({ name: 'C', slug: 'c' })
    await svc(ORG_A).trackCampaignVisit(c.id, { utmSource: 'fb', utmMedium: 'cpc' })
    const detail = await svc(ORG_A).getCampaign(c.id)
    expect(detail.stats.visits).toBe(1)
    expect(detail.stats.conversions).toBe(0)
  })

  it('attributes an order to its campaign and funnel (revenue = grandTotal), idempotently', async () => {
    const c = await svc(ORG_A).createCampaign({ name: 'C', slug: 'c' })
    const f = await svc(ORG_A).createFunnel({ name: 'F', slug: 'f' })
    await db.insert(order).values([makeOrder('o1', ORG_A, { campaignId: c.id, funnelId: f.id, grandTotal: 2500 })])

    const first = await svc(ORG_A).attributeOrder('o1')
    expect(first.campaign).toBeTruthy()
    expect(first.funnel).toBeTruthy()

    // second call must not create duplicate conversions
    const second = await svc(ORG_A).attributeOrder('o1')
    expect(second.campaign).toBeUndefined()
    expect(second.funnel).toBeUndefined()

    const cDetail = await svc(ORG_A).getCampaign(c.id)
    expect(cDetail.stats.conversions).toBe(1)
    expect(cDetail.stats.revenue).toBe(2500)
    const fDetail = await svc(ORG_A).getFunnel(f.id)
    expect(fDetail.stats.orders).toBe(1)
    expect(fDetail.stats.revenue).toBe(2500)
  })

  it('does not attribute another tenant order', async () => {
    const c = await svc(ORG_A).createCampaign({ name: 'C', slug: 'c' })
    await db.insert(order).values([makeOrder('o-b', ORG_B, { campaignId: c.id, grandTotal: 999 })])
    // ORG_A service cannot see ORG_B order -> Order not found
    await expect(svc(ORG_A).attributeOrder('o-b')).rejects.toThrow(/order not found/i)
  })

  it('overview aggregates revenue across campaigns and funnels', async () => {
    const c = await svc(ORG_A).createCampaign({ name: 'C', slug: 'c' })
    const f = await svc(ORG_A).createFunnel({ name: 'F', slug: 'f' })
    await db.insert(order).values([
      makeOrder('o1', ORG_A, { campaignId: c.id, grandTotal: 1000 }),
      makeOrder('o2', ORG_A, { funnelId: f.id, grandTotal: 500 }),
    ])
    await svc(ORG_A).attributeOrder('o1')
    await svc(ORG_A).attributeOrder('o2')
    const overview = await svc(ORG_A).getOverview()
    expect(overview.totalRevenue).toBe(1500)
  })
})
