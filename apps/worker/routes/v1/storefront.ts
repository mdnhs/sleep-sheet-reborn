import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createStorefrontService } from '../../services/v1/storefront.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const SeoFields = {
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().optional(),
}
const PageCreate = z.object({
  title: z.string().min(1), slug: z.string().optional(), content: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(), canonicalUrl: z.string().optional(), ...SeoFields,
})
const PageUpdate = PageCreate.partial()
const PostCreate = z.object({
  title: z.string().min(1), slug: z.string().optional(), excerpt: z.string().optional(),
  content: z.string().optional(), coverImage: z.string().optional(), category: z.string().optional(),
  tags: z.string().optional(), status: z.enum(['DRAFT', 'PUBLISHED']).optional(), ...SeoFields,
})
const PostUpdate = PostCreate.partial()
const MenuSave = z.object({ name: z.string().min(1), items: z.any() })
const RedirectCreate = z.object({ fromPath: z.string().min(1), toPath: z.string().min(1), type: z.enum(['301', '302']).optional() })
const SectionCreate = z.object({
  type: z.enum(['HERO', 'CATEGORY_GRID', 'FEATURED_PRODUCTS', 'FLASH_SALE', 'BEST_SELLERS', 'TESTIMONIALS', 'BLOG_POSTS', 'BANNER', 'CUSTOM_HTML']),
  position: z.number().int().optional(), config: z.any().optional(),
})
const SectionUpdate = z.object({ position: z.number().int().optional(), enabled: z.boolean().optional(), config: z.any().optional() })

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createStorefrontService(c.get('db'), tenant.id)
}
function fail(c: any, e: unknown, msg: string) {
  if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
  return c.json(err('INTERNAL_ERROR', msg), 500)
}
const actor = (c: any) => c.get('user')?.id

const app = new Hono<HonoEnv>()
  // ── Themes ──────────────────────────────────────────────────────────────────────
  .get('/themes', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listThemes())) } catch (e) { return fail(c, e, 'Failed to list themes') }
  })
  .get('/themes/installed', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listOrgThemes())) } catch (e) { return fail(c, e, 'Failed to list installed themes') }
  })
  .get('/themes/active', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getActiveTheme())) } catch (e) { return fail(c, e, 'Failed to get active theme') }
  })
  .post('/themes/install', requirePermission('themes.install'), zValidator('json', z.object({ themeId: z.string().min(1) })), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.installTheme(c.req.valid('json').themeId, actor(c))), 201) } catch (e) { return fail(c, e, 'Failed to install theme') }
  })
  .post('/themes/:id/activate', requirePermission('themes.activate'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.activateTheme(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to activate theme') }
  })
  .patch('/themes/:id/config', requirePermission('themes.update'), zValidator('json', z.object({ config: z.any() })), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateThemeConfig(c.req.param('id'), c.req.valid('json').config, actor(c)))) } catch (e) { return fail(c, e, 'Failed to update theme config') }
  })

  // ── Pages ─────────────────────────────────────────────────────────────────────
  .get('/pages', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listPages(c.req.query('status')))) } catch (e) { return fail(c, e, 'Failed to list pages') }
  })
  .post('/pages', requirePermission('pages.manage'), zValidator('json', PageCreate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createPage({ ...c.req.valid('json'), actorId: actor(c) })), 201) } catch (e) { return fail(c, e, 'Failed to create page') }
  })
  .get('/pages/:id', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getPage(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to get page') }
  })
  .patch('/pages/:id', requirePermission('pages.manage'), zValidator('json', PageUpdate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updatePage(c.req.param('id'), { ...c.req.valid('json'), actorId: actor(c) }))) } catch (e) { return fail(c, e, 'Failed to update page') }
  })

  // ── Blog ──────────────────────────────────────────────────────────────────────
  .get('/blog', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listPosts(c.req.query('status')))) } catch (e) { return fail(c, e, 'Failed to list posts') }
  })
  .post('/blog', requirePermission('blogs.manage'), zValidator('json', PostCreate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createPost({ ...c.req.valid('json'), actorId: actor(c) })), 201) } catch (e) { return fail(c, e, 'Failed to create post') }
  })
  .get('/blog/:id', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.getPost(c.req.param('id')))) } catch (e) { return fail(c, e, 'Failed to get post') }
  })
  .patch('/blog/:id', requirePermission('blogs.manage'), zValidator('json', PostUpdate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updatePost(c.req.param('id'), { ...c.req.valid('json'), actorId: actor(c) }))) } catch (e) { return fail(c, e, 'Failed to update post') }
  })

  // ── Menus ─────────────────────────────────────────────────────────────────────
  .get('/menus', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listMenus())) } catch (e) { return fail(c, e, 'Failed to list menus') }
  })
  .put('/menus/:location', requirePermission('menus.manage'), zValidator('json', MenuSave), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const loc = c.req.param('location').toUpperCase()
    if (!['HEADER', 'FOOTER', 'MOBILE'].includes(loc)) return c.json(err('SERVICE_ERROR', 'Invalid menu location'), 400)
    try { return c.json(ok(await s.saveMenu(loc as any, { ...c.req.valid('json'), actorId: actor(c) }))) } catch (e) { return fail(c, e, 'Failed to save menu') }
  })

  // ── Redirects ───────────────────────────────────────────────────────────────────
  .get('/redirects', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listRedirects())) } catch (e) { return fail(c, e, 'Failed to list redirects') }
  })
  .post('/redirects', requirePermission('storefront.manage'), zValidator('json', RedirectCreate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.createRedirect({ ...c.req.valid('json'), actorId: actor(c) })), 201) } catch (e) { return fail(c, e, 'Failed to create redirect') }
  })
  .delete('/redirects/:id', requirePermission('storefront.manage'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.deleteRedirect(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to delete redirect') }
  })

  // ── Homepage builder ─────────────────────────────────────────────────────────────
  .get('/homepage-sections', requirePermission('storefront.view'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.listSections())) } catch (e) { return fail(c, e, 'Failed to list sections') }
  })
  .post('/homepage-sections', requirePermission('storefront.manage'), zValidator('json', SectionCreate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.addSection({ ...c.req.valid('json'), actorId: actor(c) })), 201) } catch (e) { return fail(c, e, 'Failed to add section') }
  })
  .patch('/homepage-sections/:id', requirePermission('storefront.manage'), zValidator('json', SectionUpdate), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.updateSection(c.req.param('id'), { ...c.req.valid('json'), actorId: actor(c) }))) } catch (e) { return fail(c, e, 'Failed to update section') }
  })
  .delete('/homepage-sections/:id', requirePermission('storefront.manage'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.deleteSection(c.req.param('id'), actor(c)))) } catch (e) { return fail(c, e, 'Failed to delete section') }
  })

export default app
