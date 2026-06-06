import { describe, it, expect, beforeEach } from 'vitest'
import { organization, theme, page, blogPost, redirect, homepageSection, organizationTheme } from '@repo/database/src/schema'
import { createStorefrontCmsRepository } from '../../apps/worker/repositories/storefront-cms.repository'
import { createThemesRepository } from '../../apps/worker/repositories/themes.repository'
import { createStorefrontService } from '../../apps/worker/services/v1/storefront.service'
import { createTestDb, makeOrg, makeTheme, type TestDb } from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
  await db.insert(theme).values([makeTheme('theme_aurora', 'aurora'), makeTheme('theme_volt', 'volt')])
})

const svc = (org: string) => createStorefrontService(db as any, org)

// ─── Isolation ──────────────────────────────────────────────────────────────────

describe('Storefront isolation', () => {
  beforeEach(async () => {
    await svc(ORG_A).createPage({ title: 'About', slug: 'about' })
    await svc(ORG_B).createPage({ title: 'About B', slug: 'about' })
  })

  it('page repo A sees only org A', async () => {
    const repo = createStorefrontCmsRepository(db as any, ORG_A)
    const rows = await repo.findPages()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_A)
  })

  it('same slug allowed across orgs (per-org unique)', async () => {
    const a = await createStorefrontCmsRepository(db as any, ORG_A).findPageBySlug('about')
    const b = await createStorefrontCmsRepository(db as any, ORG_B).findPageBySlug('about')
    expect(a?.organizationId).toBe(ORG_A)
    expect(b?.organizationId).toBe(ORG_B)
  })

  it('page findBySlug cross-tenant returns null for other org content', async () => {
    await svc(ORG_A).createPage({ title: 'Secret', slug: 'secret' })
    const repoB = createStorefrontCmsRepository(db as any, ORG_B)
    expect(await repoB.findPageBySlug('secret')).toBeNull()
  })

  it('page update cross-tenant is a no-op', async () => {
    const aPage = await createStorefrontCmsRepository(db as any, ORG_A).findPageBySlug('about')
    const repoB = createStorefrontCmsRepository(db as any, ORG_B)
    await repoB.updatePage(aPage!.id, { title: 'Hacked' })
    const after = await createStorefrontCmsRepository(db as any, ORG_A).findPage(aPage!.id)
    expect(after?.title).toBe('About')
  })
})

// ─── Pages ──────────────────────────────────────────────────────────────────────

describe('Pages', () => {
  it('slugifies title when no slug given', async () => {
    const p = await svc(ORG_A).createPage({ title: 'Return Policy!' })
    expect(p.slug).toBe('return-policy')
  })
  it('duplicate slug in same org is rejected', async () => {
    await svc(ORG_A).createPage({ title: 'About', slug: 'about' })
    await expect(svc(ORG_A).createPage({ title: 'About 2', slug: 'about' })).rejects.toThrow(/already exists/)
  })
})

// ─── Blog ───────────────────────────────────────────────────────────────────────

describe('Blog', () => {
  it('stamps publishedAt when created as PUBLISHED', async () => {
    const post = await svc(ORG_A).createPost({ title: 'Hello', status: 'PUBLISHED' })
    expect(post.publishedAt).not.toBeNull()
  })
  it('stamps publishedAt on transition DRAFT -> PUBLISHED', async () => {
    const post = await svc(ORG_A).createPost({ title: 'Draft' })
    expect(post.publishedAt).toBeNull()
    const updated = await svc(ORG_A).updatePost(post.id, { status: 'PUBLISHED' })
    expect(updated?.publishedAt).not.toBeNull()
  })
})

// ─── Themes (one active per org) ──────────────────────────────────────────────────

describe('Themes', () => {
  it('install is idempotent per themeId', async () => {
    const a1 = await svc(ORG_A).installTheme('theme_aurora')
    const a2 = await svc(ORG_A).installTheme('theme_aurora')
    expect(a2.id).toBe(a1.id)
    const repo = createThemesRepository(db as any, ORG_A)
    expect(await repo.findOrgThemes()).toHaveLength(1)
  })

  it('install unknown theme rejected', async () => {
    await expect(svc(ORG_A).installTheme('nope')).rejects.toThrow(/not found/i)
  })

  it('activating a theme deactivates all others (one active per org)', async () => {
    const aurora = await svc(ORG_A).installTheme('theme_aurora')
    const volt = await svc(ORG_A).installTheme('theme_volt')
    await svc(ORG_A).activateTheme(aurora.id)
    await svc(ORG_A).activateTheme(volt.id)
    const active = await svc(ORG_A).getActiveTheme()
    expect(active?.id).toBe(volt.id)
    const all = await createThemesRepository(db as any, ORG_A).findOrgThemes()
    expect(all.filter(t => t.isActive)).toHaveLength(1)
  })

  it('org theme install is isolated per org', async () => {
    await svc(ORG_A).installTheme('theme_aurora')
    const repoB = createThemesRepository(db as any, ORG_B)
    expect(await repoB.findOrgThemes()).toHaveLength(0)
  })
})

// ─── Redirects ────────────────────────────────────────────────────────────────────

describe('Redirects', () => {
  it('fromPath must start with /', async () => {
    await expect(svc(ORG_A).createRedirect({ fromPath: 'old', toPath: '/new' })).rejects.toThrow(/start with/)
  })
  it('duplicate fromPath in same org rejected', async () => {
    await svc(ORG_A).createRedirect({ fromPath: '/old', toPath: '/new' })
    await expect(svc(ORG_A).createRedirect({ fromPath: '/old', toPath: '/other' })).rejects.toThrow(/already exists/)
  })
  it('redirects are org-scoped', async () => {
    await svc(ORG_A).createRedirect({ fromPath: '/old', toPath: '/new' })
    const rowsB = await createStorefrontCmsRepository(db as any, ORG_B).findRedirects()
    expect(rowsB).toHaveLength(0)
  })
})

// ─── Homepage builder ──────────────────────────────────────────────────────────────

describe('Homepage builder', () => {
  it('auto-assigns incrementing position and lists ordered', async () => {
    await svc(ORG_A).addSection({ type: 'HERO' })
    await svc(ORG_A).addSection({ type: 'FEATURED_PRODUCTS' })
    await svc(ORG_A).addSection({ type: 'BLOG_POSTS' })
    const sections = await svc(ORG_A).listSections()
    expect(sections.map(s => s.position)).toEqual([0, 1, 2])
    expect(sections.map(s => s.type)).toEqual(['HERO', 'FEATURED_PRODUCTS', 'BLOG_POSTS'])
  })
  it('sections are org-scoped', async () => {
    await svc(ORG_A).addSection({ type: 'HERO' })
    expect(await svc(ORG_B).listSections()).toHaveLength(0)
  })
  it('delete removes a section', async () => {
    const s = await svc(ORG_A).addSection({ type: 'HERO' })
    await svc(ORG_A).deleteSection(s.id)
    expect(await svc(ORG_A).listSections()).toHaveLength(0)
  })
})
