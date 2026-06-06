import type { Database } from '@repo/database'
import { createThemesRepository } from '../../repositories/themes.repository'
import { createFunnelsRepository } from '../../repositories/funnels.repository'
import { createMarketplaceRepository } from '../../repositories/marketplace.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { requireFeature, enforceLimit } from '../../utils/plan-limits'
import { ServiceError } from '../../utils/service-error'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function createMarketplaceService(db: Database, organizationId: string) {
  const themes = createThemesRepository(db, organizationId)
  const funnels = createFunnelsRepository(db, organizationId)
  const market = createMarketplaceRepository(db, organizationId)
  const audit = createAuditLogRepository(db, organizationId)

  return {
    // ════════ THEME MARKETPLACE ════════════════════════════════════════════════════

    async browseThemes() {
      const [catalog, installed, active, purchases] = await Promise.all([
        themes.listThemes(), themes.findOrgThemes(), themes.findActive(), market.listThemePurchases(),
      ])
      const installedByTheme = new Map(installed.map(i => [i.themeId, i]))
      const purchasedIds = new Set(purchases.map(p => p.themeId))
      return catalog.map(t => ({
        ...t,
        owned: t.type === 'FREE' || purchasedIds.has(t.id),
        installed: installedByTheme.has(t.id),
        active: active?.themeId === t.id,
        orgThemeId: installedByTheme.get(t.id)?.id ?? null,
      }))
    },

    async purchaseTheme(themeId: string, actorId?: string) {
      const t = await themes.findTheme(themeId)
      if (!t) throw new ServiceError('Theme not found', 404)
      if (t.type !== 'PREMIUM') throw new ServiceError('Free themes do not require purchase', 400)
      await requireFeature(db, organizationId, 'theme_marketplace')
      const existing = await market.findThemePurchase(themeId)
      if (existing) return existing
      const purchase = await market.createThemePurchase(themeId, t.price)
      await audit.log('theme_purchase', purchase.id, 'purchase', actorId, { themeId, price: t.price })
      return purchase
    },

    /** Install a marketplace theme. Premium themes require the theme_marketplace flag + prior purchase. */
    async installTheme(themeId: string, actorId?: string) {
      const t = await themes.findTheme(themeId)
      if (!t) throw new ServiceError('Theme not found', 404)
      if (t.type === 'PREMIUM') {
        await requireFeature(db, organizationId, 'theme_marketplace')
        if (!(await market.findThemePurchase(themeId))) throw new ServiceError('Theme must be purchased before install', 402)
      }
      const existing = await themes.findByThemeId(themeId)
      if (existing) return existing
      await enforceLimit(db, organizationId, 'limitThemes', (await themes.findOrgThemes()).length)
      const latest = await themes.latestVersion(themeId)
      const ot = await themes.create({ themeId, version: latest?.version ?? null, isActive: false })
      await audit.log('organization_theme', ot.id, 'install', actorId, { themeId, name: t.name })
      return ot
    },

    async activateTheme(orgThemeId: string, actorId?: string) {
      const ot = await themes.findOrgTheme(orgThemeId)
      if (!ot) throw new ServiceError('Theme not installed', 404)
      await themes.deactivateAll()
      const updated = await themes.update(orgThemeId, { isActive: true })
      await audit.log('organization_theme', orgThemeId, 'activate', actorId, { themeId: ot.themeId })
      return updated
    },

    /** Update an installed theme to the latest published version. */
    async updateTheme(orgThemeId: string, actorId?: string) {
      const ot = await themes.findOrgTheme(orgThemeId)
      if (!ot) throw new ServiceError('Theme not installed', 404)
      const latest = await themes.latestVersion(ot.themeId)
      if (!latest) throw new ServiceError('No versions published for this theme', 404)
      if (latest.version === ot.version) throw new ServiceError('Theme is already on the latest version', 400)
      const updated = await themes.update(orgThemeId, { version: latest.version })
      await audit.log('organization_theme', orgThemeId, 'update', actorId, { from: ot.version, to: latest.version })
      return updated
    },

    // ════════ FUNNEL MARKETPLACE ═══════════════════════════════════════════════════

    async browseFunnels() {
      const [catalog, purchases, orgFunnels] = await Promise.all([
        funnels.listTemplates(), market.listFunnelPurchases(), market.listOrgFunnels(),
      ])
      const purchasedIds = new Set(purchases.map(p => p.funnelTemplateId))
      const installCount = new Map<string, number>()
      for (const of of orgFunnels) {
        if (of.funnelTemplateId) installCount.set(of.funnelTemplateId, (installCount.get(of.funnelTemplateId) ?? 0) + 1)
      }
      return catalog.map(t => ({
        ...t,
        owned: t.price === 0 || purchasedIds.has(t.id),
        installs: installCount.get(t.id) ?? 0,
      }))
    },

    async purchaseFunnelTemplate(templateId: string, actorId?: string) {
      const t = await funnels.findTemplate(templateId)
      if (!t) throw new ServiceError('Funnel template not found', 404)
      if (t.price === 0) throw new ServiceError('Free funnel templates do not require purchase', 400)
      await requireFeature(db, organizationId, 'funnels')
      const existing = await market.findFunnelPurchase(templateId)
      if (existing) return existing
      const purchase = await market.createFunnelPurchase(templateId, t.price)
      await audit.log('funnel_purchase', purchase.id, 'purchase', actorId, { templateId, price: t.price })
      return purchase
    },

    /**
     * Install (clone) a funnel template into the org as a new funnel instance.
     * Funnels are a gated capability (funnels flag). Premium templates require purchase.
     */
    async installFunnel(templateId: string, name: string | undefined, actorId?: string) {
      const t = await funnels.findTemplate(templateId)
      if (!t) throw new ServiceError('Funnel template not found', 404)
      await requireFeature(db, organizationId, 'funnels')
      if (t.price > 0 && !(await market.findFunnelPurchase(templateId))) {
        throw new ServiceError('Funnel template must be purchased before install', 402)
      }
      await enforceLimit(db, organizationId, 'limitFunnels', (await funnels.findMany()).length)

      const baseName = name || t.name
      let slug = slugify(baseName)
      if (await funnels.findBySlug(slug)) slug = `${slug}-${Date.now().toString(36)}`

      const f = await funnels.create({
        templateId, name: baseName, slug, type: t.type, config: null, status: 'DRAFT',
      })
      const of = await market.createOrgFunnel({ funnelId: f.id, funnelTemplateId: templateId, version: '1.0.0' })
      await audit.log('funnel', f.id, 'install', actorId, { templateId, type: t.type })
      return { funnel: f, organizationFunnel: of }
    },

    async listInstalledFunnels() {
      return market.listOrgFunnels()
    },
  }
}

export type MarketplaceService = ReturnType<typeof createMarketplaceService>
