import { describe, it, expect, beforeEach } from 'vitest'
import { organization, featureFlag, theme, themeVersion, funnelTemplate, themePurchase } from '@repo/database/src/schema'
import { createMarketplaceService } from '../../apps/worker/services/v1/marketplace.service'
import { createMarketplaceRepository } from '../../apps/worker/repositories/marketplace.repository'
import { createThemesRepository } from '../../apps/worker/repositories/themes.repository'
import { createFunnelsRepository } from '../../apps/worker/repositories/funnels.repository'
import {
  createTestDb, makeOrg, makeFlag, makeTheme, makeThemeVersion, makeFunnelTemplate, type TestDb,
} from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
  await db.insert(theme).values([
    makeTheme('th_free', 'free-theme', 'FREE', 0),
    makeTheme('th_prem', 'prem-theme', 'PREMIUM', 9900),
  ])
  await db.insert(themeVersion).values([makeThemeVersion('tv1', 'th_free', '1.0.0')])
  await db.insert(funnelTemplate).values([
    makeFunnelTemplate('ft_free', 'SINGLE', 0),
    makeFunnelTemplate('ft_prem', 'BUNDLE', 5000),
  ])
})

const svc = (org: string) => createMarketplaceService(db as any, org)
async function enable(org: string, flag: string) {
  await db.insert(featureFlag).values(makeFlag(`f-${org}-${flag}`, org, flag, true))
}

// ─── Theme marketplace ────────────────────────────────────────────────────────────

describe('Theme marketplace', () => {
  it('browse flags free themes as owned, premium as not owned', async () => {
    const rows = await svc(ORG_A).browseThemes()
    const free = rows.find(r => r.id === 'th_free')!
    const prem = rows.find(r => r.id === 'th_prem')!
    expect(free.owned).toBe(true)
    expect(prem.owned).toBe(false)
    expect(free.installed).toBe(false)
  })

  it('installs a free theme without any plan feature flag', async () => {
    const ot = await svc(ORG_A).installTheme('th_free')
    expect(ot.themeId).toBe('th_free')
    expect(ot.version).toBe('1.0.0') // latest version applied
    const browse = await svc(ORG_A).browseThemes()
    expect(browse.find(r => r.id === 'th_free')!.installed).toBe(true)
  })

  it('blocks premium theme install without the theme_marketplace feature', async () => {
    await expect(svc(ORG_A).installTheme('th_prem')).rejects.toThrow(/FEATURE_DISABLED/)
  })

  it('blocks premium purchase without feature, allows with feature, then install works', async () => {
    await expect(svc(ORG_A).purchaseTheme('th_prem')).rejects.toThrow(/FEATURE_DISABLED/)
    await enable(ORG_A, 'theme_marketplace')
    const purchase = await svc(ORG_A).purchaseTheme('th_prem')
    expect(purchase.pricePaid).toBe(9900)
    // idempotent
    const again = await svc(ORG_A).purchaseTheme('th_prem')
    expect(again.id).toBe(purchase.id)
    const ot = await svc(ORG_A).installTheme('th_prem')
    expect(ot.themeId).toBe('th_prem')
  })

  it('rejects purchasing a free theme', async () => {
    await expect(svc(ORG_A).purchaseTheme('th_free')).rejects.toThrow(/do not require purchase/)
  })

  it('install is idempotent and activate enforces one active', async () => {
    const free = await svc(ORG_A).installTheme('th_free')
    const dup = await svc(ORG_A).installTheme('th_free')
    expect(dup.id).toBe(free.id)
    await db.insert(theme).values(makeTheme('th_two', 'two', 'FREE', 0))
    const two = await svc(ORG_A).installTheme('th_two')
    await svc(ORG_A).activateTheme(free.id)
    await svc(ORG_A).activateTheme(two.id)
    const active = await createThemesRepository(db as any, ORG_A).findActive()
    expect(active?.id).toBe(two.id)
  })

  it('updateTheme bumps to the latest published version', async () => {
    const ot = await svc(ORG_A).installTheme('th_free') // version 1.0.0
    await db.insert(themeVersion).values({ ...makeThemeVersion('tv2', 'th_free', '2.0.0'), createdAt: new Date(Date.now() + 60_000) })
    const updated = await svc(ORG_A).updateTheme(ot.id)
    expect(updated?.version).toBe('2.0.0')
    await expect(svc(ORG_A).updateTheme(ot.id)).rejects.toThrow(/already on the latest/)
  })

  it('theme purchases are org-scoped', async () => {
    await enable(ORG_A, 'theme_marketplace')
    await svc(ORG_A).purchaseTheme('th_prem')
    expect(await createMarketplaceRepository(db as any, ORG_B).findThemePurchase('th_prem')).toBeNull()
  })
})

// ─── Funnel marketplace ─────────────────────────────────────────────────────────────

describe('Funnel marketplace', () => {
  it('blocks funnel install without the funnels feature', async () => {
    await expect(svc(ORG_A).installFunnel('ft_free', undefined)).rejects.toThrow(/FEATURE_DISABLED/)
  })

  it('installs (clones) a free template into an org funnel with the funnels feature', async () => {
    await enable(ORG_A, 'funnels')
    const { funnel, organizationFunnel } = await svc(ORG_A).installFunnel('ft_free', 'My Funnel')
    expect(funnel.type).toBe('SINGLE')
    expect(funnel.slug).toBe('my-funnel')
    expect(organizationFunnel.funnelTemplateId).toBe('ft_free')
    const funnels = await createFunnelsRepository(db as any, ORG_A).findMany()
    expect(funnels).toHaveLength(1)
  })

  it('blocks premium funnel install without purchase, allows after purchase', async () => {
    await enable(ORG_A, 'funnels')
    await expect(svc(ORG_A).installFunnel('ft_prem', undefined)).rejects.toThrow(/must be purchased/)
    await svc(ORG_A).purchaseFunnelTemplate('ft_prem')
    const { funnel } = await svc(ORG_A).installFunnel('ft_prem', undefined)
    expect(funnel.type).toBe('BUNDLE')
  })

  it('rejects purchasing a free funnel template', async () => {
    await enable(ORG_A, 'funnels')
    await expect(svc(ORG_A).purchaseFunnelTemplate('ft_free')).rejects.toThrow(/do not require purchase/)
  })

  it('installed funnels are org-scoped', async () => {
    await enable(ORG_A, 'funnels')
    await svc(ORG_A).installFunnel('ft_free', 'A Funnel')
    expect(await svc(ORG_B).listInstalledFunnels()).toHaveLength(0)
  })
})
