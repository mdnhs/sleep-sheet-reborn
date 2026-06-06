import type { Database, Page, BlogPost, Menu, Redirect, HomepageSection } from '@repo/database'
import { createThemesRepository } from '../../repositories/themes.repository'
import { createStorefrontCmsRepository } from '../../repositories/storefront-cms.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function createStorefrontService(db: Database, organizationId: string) {
  const themes = createThemesRepository(db, organizationId)
  const cms = createStorefrontCmsRepository(db, organizationId)
  const audit = createAuditLogRepository(db, organizationId)

  return {
    // ── Themes ──────────────────────────────────────────────────────────────────
    listThemes() { return themes.listThemes() },
    listOrgThemes() { return themes.findOrgThemes() },
    getActiveTheme() { return themes.findActive() },

    /** Install (add) a catalog theme to the org. Idempotent per themeId. */
    async installTheme(themeId: string, actorId?: string) {
      const t = await themes.findTheme(themeId)
      if (!t) throw new ServiceError('Theme not found', 404)
      const existing = await themes.findByThemeId(themeId)
      if (existing) return existing
      const latest = await themes.latestVersion(themeId)
      const ot = await themes.create({ themeId, version: latest?.version ?? null, isActive: false })
      await audit.log('organization_theme', ot.id, 'install', actorId, { themeId, name: t.name })
      return ot
    },

    /** Activate one org theme; deactivates the rest (one active per org). */
    async activateTheme(orgThemeId: string, actorId?: string) {
      const ot = await themes.findOrgTheme(orgThemeId)
      if (!ot) throw new ServiceError('Theme not installed', 404)
      await themes.deactivateAll()
      const updated = await themes.update(orgThemeId, { isActive: true })
      await audit.log('organization_theme', orgThemeId, 'activate', actorId, { themeId: ot.themeId })
      return updated
    },

    /** Update theme settings (logo, colors, typography, custom scripts) as JSON. */
    async updateThemeConfig(orgThemeId: string, config: unknown, actorId?: string) {
      const ot = await themes.findOrgTheme(orgThemeId)
      if (!ot) throw new ServiceError('Theme not installed', 404)
      const updated = await themes.update(orgThemeId, { config: JSON.stringify(config) })
      await audit.log('organization_theme', orgThemeId, 'configure', actorId, {})
      return updated
    },

    // ── Pages ───────────────────────────────────────────────────────────────────
    listPages(status?: string) { return cms.findPages(status as Page['status']) },
    getPage(id: string) { return cms.findPage(id) },

    async createPage(data: { title: string; slug?: string; content?: string; status?: Page['status']; metaTitle?: string; metaDescription?: string; ogImage?: string; canonicalUrl?: string; actorId?: string }) {
      const slug = slugify(data.slug || data.title)
      if (!slug) throw new ServiceError('A valid slug is required', 400)
      if (await cms.findPageBySlug(slug)) throw new ServiceError('A page with this slug already exists', 409)
      const row = await cms.createPage({
        title: data.title, slug, content: data.content ?? null, status: data.status ?? 'DRAFT',
        metaTitle: data.metaTitle ?? null, metaDescription: data.metaDescription ?? null,
        ogImage: data.ogImage ?? null, canonicalUrl: data.canonicalUrl ?? null,
      })
      await audit.log('page', row.id, 'create', data.actorId, { slug })
      return row
    },

    async updatePage(id: string, data: Partial<Pick<Page, 'title' | 'slug' | 'content' | 'status' | 'metaTitle' | 'metaDescription' | 'ogImage' | 'canonicalUrl'>> & { actorId?: string }) {
      const existing = await cms.findPage(id)
      if (!existing) throw new ServiceError('Page not found', 404)
      const patch: Record<string, unknown> = { ...data }
      delete patch.actorId
      if (data.slug && data.slug !== existing.slug) {
        const slug = slugify(data.slug)
        if (await cms.findPageBySlug(slug)) throw new ServiceError('A page with this slug already exists', 409)
        patch.slug = slug
      }
      const updated = await cms.updatePage(id, patch as any)
      await audit.log('page', id, 'update', data.actorId, { fields: Object.keys(patch) })
      return updated
    },

    // ── Blog ──────────────────────────────────────────────────────────────────────
    listPosts(status?: string) { return cms.findPosts(status as BlogPost['status']) },
    getPost(id: string) { return cms.findPost(id) },

    async createPost(data: { title: string; slug?: string; excerpt?: string; content?: string; coverImage?: string; category?: string; tags?: string; status?: BlogPost['status']; metaTitle?: string; metaDescription?: string; ogImage?: string; actorId?: string }) {
      const slug = slugify(data.slug || data.title)
      if (!slug) throw new ServiceError('A valid slug is required', 400)
      if (await cms.findPostBySlug(slug)) throw new ServiceError('A post with this slug already exists', 409)
      const status = data.status ?? 'DRAFT'
      const row = await cms.createPost({
        title: data.title, slug, excerpt: data.excerpt ?? null, content: data.content ?? null,
        coverImage: data.coverImage ?? null, category: data.category ?? null, tags: data.tags ?? null,
        status, publishedAt: status === 'PUBLISHED' ? new Date() : null,
        metaTitle: data.metaTitle ?? null, metaDescription: data.metaDescription ?? null, ogImage: data.ogImage ?? null,
      })
      await audit.log('blog_post', row.id, 'create', data.actorId, { slug })
      return row
    },

    async updatePost(id: string, data: Partial<Pick<BlogPost, 'title' | 'slug' | 'excerpt' | 'content' | 'coverImage' | 'category' | 'tags' | 'status' | 'metaTitle' | 'metaDescription' | 'ogImage'>> & { actorId?: string }) {
      const existing = await cms.findPost(id)
      if (!existing) throw new ServiceError('Post not found', 404)
      const patch: Record<string, unknown> = { ...data }
      delete patch.actorId
      if (data.slug && data.slug !== existing.slug) {
        const slug = slugify(data.slug)
        if (await cms.findPostBySlug(slug)) throw new ServiceError('A post with this slug already exists', 409)
        patch.slug = slug
      }
      // Stamp publishedAt the first time it transitions to PUBLISHED
      if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED' && !existing.publishedAt) {
        patch.publishedAt = new Date()
      }
      const updated = await cms.updatePost(id, patch as any)
      await audit.log('blog_post', id, 'update', data.actorId, { fields: Object.keys(patch) })
      return updated
    },

    // ── Menus ───────────────────────────────────────────────────────────────────
    listMenus() { return cms.findMenus() },
    async saveMenu(location: Menu['location'], data: { name: string; items: unknown; actorId?: string }) {
      const row = await cms.upsertMenu(location, { name: data.name, items: JSON.stringify(data.items ?? []) })
      await audit.log('menu', row?.id ?? location, 'save', data.actorId, { location })
      return row
    },

    // ── Redirects ─────────────────────────────────────────────────────────────────
    listRedirects() { return cms.findRedirects() },
    async createRedirect(data: { fromPath: string; toPath: string; type?: Redirect['type']; actorId?: string }) {
      if (!data.fromPath.startsWith('/')) throw new ServiceError('fromPath must start with /', 400)
      if (await cms.findRedirectByFrom(data.fromPath)) throw new ServiceError('A redirect for this path already exists', 409)
      const row = await cms.createRedirect({ fromPath: data.fromPath, toPath: data.toPath, type: data.type ?? '301' })
      await audit.log('redirect', row.id, 'create', data.actorId, { fromPath: data.fromPath })
      return row
    },
    async deleteRedirect(id: string, actorId?: string) {
      await cms.deleteRedirect(id)
      await audit.log('redirect', id, 'delete', actorId, {})
      return { id }
    },

    // ── Homepage builder ─────────────────────────────────────────────────────────
    listSections() { return cms.findSections() },
    async addSection(data: { type: HomepageSection['type']; position?: number; config?: unknown; actorId?: string }) {
      const sections = await cms.findSections()
      const position = data.position ?? sections.length
      const row = await cms.createSection({
        type: data.type, position, enabled: true,
        config: data.config != null ? JSON.stringify(data.config) : null,
      })
      await audit.log('homepage_section', row.id, 'create', data.actorId, { type: data.type })
      return row
    },
    async updateSection(id: string, data: { position?: number; enabled?: boolean; config?: unknown; actorId?: string }) {
      const existing = await cms.findSection(id)
      if (!existing) throw new ServiceError('Section not found', 404)
      const patch: Partial<Pick<HomepageSection, 'position' | 'enabled' | 'config'>> = {}
      if (data.position != null) patch.position = data.position
      if (data.enabled != null) patch.enabled = data.enabled
      if (data.config !== undefined) patch.config = data.config != null ? JSON.stringify(data.config) : null
      const updated = await cms.updateSection(id, patch)
      await audit.log('homepage_section', id, 'update', data.actorId, {})
      return updated
    },
    async deleteSection(id: string, actorId?: string) {
      const existing = await cms.findSection(id)
      if (!existing) throw new ServiceError('Section not found', 404)
      await cms.deleteSection(id)
      await audit.log('homepage_section', id, 'delete', actorId, {})
      return { id }
    },
  }
}

export type StorefrontService = ReturnType<typeof createStorefrontService>
