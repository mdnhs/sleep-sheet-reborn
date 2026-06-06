import { describe, it, expect, beforeEach } from 'vitest'
import { createPublicStorefrontService } from '../../apps/worker/services/public/storefront.service'
import { createTestDb, seed, type TestCtx } from './setup'

let ctx: TestCtx
let s: ReturnType<typeof seed>
const ORG_A = 'org-a'
const ORG_B = 'org-b'
const svc = (org: string) => createPublicStorefrontService(ctx.db as any, org)

beforeEach(() => {
  ctx = createTestDb()
  s = seed(ctx.sqlite)
  s.org(ORG_A); s.org(ORG_B)
  s.theme('th_aurora', 'Aurora', 'aurora')
})

describe('Public storefront — shell', () => {
  it('returns active theme config, ordered enabled sections, parsed menus', async () => {
    s.activate(ORG_A, 'th_aurora', JSON.stringify({ primaryColor: '#111' }))
    s.menu(ORG_A, 'HEADER', JSON.stringify([{ label: 'Home', url: '/' }]))
    s.section(ORG_A, 'FEATURED_PRODUCTS', 1, 1, JSON.stringify({ title: 'Featured' }))
    s.section(ORG_A, 'HERO', 0, 1, JSON.stringify({ title: 'Hi' }))
    s.section(ORG_A, 'BANNER', 2, 0, null as any) // disabled — excluded

    const data = await svc(ORG_A).getStorefront()
    expect(data.theme?.name).toBe('Aurora')
    expect((data.theme?.config as any).primaryColor).toBe('#111')
    expect(data.menus[0].items[0].label).toBe('Home')
    expect(data.homepage.map(h => h.type)).toEqual(['HERO', 'FEATURED_PRODUCTS']) // ordered, disabled dropped
  })

  it('returns null theme when none active', async () => {
    const data = await svc(ORG_A).getStorefront()
    expect(data.theme).toBeNull()
  })
})

describe('Public storefront — products', () => {
  it('lists only ACTIVE products with min price + first image', async () => {
    const p = s.product(ORG_A, 'shirt', 'ACTIVE')
    s.variant(ORG_A, p, 500)
    s.variant(ORG_A, p, 300)
    s.image(ORG_A, p, 'https://img/1.jpg', 0)
    s.product(ORG_A, 'hidden', 'DRAFT')

    const list = await svc(ORG_A).listProducts()
    expect(list).toHaveLength(1)
    expect(list[0].slug).toBe('shirt')
    expect(list[0].price).toBe(300)
    expect(list[0].image).toBe('https://img/1.jpg')
  })

  it('getProduct returns ACTIVE detail; DRAFT is 404', async () => {
    const p = s.product(ORG_A, 'shirt', 'ACTIVE')
    s.variant(ORG_A, p, 500)
    const detail = await svc(ORG_A).getProduct('shirt')
    expect(detail.variants[0].price).toBe(500)
    s.product(ORG_A, 'draft', 'DRAFT')
    await expect(svc(ORG_A).getProduct('draft')).rejects.toThrow(/not found/i)
  })
})

describe('Public storefront — pages & blog', () => {
  it('serves PUBLISHED page, 404 for draft', async () => {
    s.page(ORG_A, 'about', 'PUBLISHED')
    expect((await svc(ORG_A).getPage('about')).slug).toBe('about')
    s.page(ORG_A, 'secret', 'DRAFT')
    await expect(svc(ORG_A).getPage('secret')).rejects.toThrow(/not found/i)
  })

  it('lists only PUBLISHED blog posts', async () => {
    s.post(ORG_A, 'launch', 'PUBLISHED')
    s.post(ORG_A, 'wip', 'DRAFT')
    const posts = await svc(ORG_A).listBlog()
    expect(posts).toHaveLength(1)
    expect(posts[0].slug).toBe('launch')
  })
})

describe('Public catalog — browse & search', () => {
  it('lists active categories', async () => {
    s.category(ORG_A, 'shirts')
    s.category(ORG_A, 'pants', 'INACTIVE')
    const cats = await svc(ORG_A).listCategories()
    expect(cats.map(c => c.slug)).toEqual(['shirts'])
  })

  it('searches products by name', async () => {
    s.product(ORG_A, 'red-shirt', 'ACTIVE')
    s.product(ORG_A, 'blue-jeans', 'ACTIVE')
    const res = await svc(ORG_A).browseProducts({ search: 'shirt' })
    expect(res.items.map(i => i.slug)).toEqual(['red-shirt'])
    expect(res.total).toBe(1)
  })

  it('filters by category slug', async () => {
    const cat = s.category(ORG_A, 'shirts')
    s.product(ORG_A, 'shirt-a', 'ACTIVE', cat)
    s.product(ORG_A, 'jeans-a', 'ACTIVE', null)
    const res = await svc(ORG_A).browseProducts({ categorySlug: 'shirts' })
    expect(res.items.map(i => i.slug)).toEqual(['shirt-a'])
  })

  it('unknown category returns empty', async () => {
    s.product(ORG_A, 'x', 'ACTIVE')
    const res = await svc(ORG_A).browseProducts({ categorySlug: 'nope' })
    expect(res.total).toBe(0)
  })

  it('paginates with total count', async () => {
    for (let i = 0; i < 5; i++) s.product(ORG_A, `p-${i}`, 'ACTIVE')
    const res = await svc(ORG_A).browseProducts({ limit: 2, offset: 0 })
    expect(res.items).toHaveLength(2)
    expect(res.total).toBe(5)
  })

  it('catalog excludes DRAFT and other tenants', async () => {
    s.product(ORG_A, 'live', 'ACTIVE')
    s.product(ORG_A, 'draft', 'DRAFT')
    s.product(ORG_B, 'b', 'ACTIVE')
    const res = await svc(ORG_A).browseProducts({})
    expect(res.items.map(i => i.slug)).toEqual(['live'])
  })
})

describe('Public checkout — guards', () => {
  const customer = { name: 'Buyer', phone: '0170', address: 'St 1', city: 'Dhaka' }

  it('rejects an empty cart', async () => {
    await expect(svc(ORG_A).createOrder({ items: [], customer })).rejects.toThrow(/cart is empty/i)
  })

  it('rejects when the store has no active location', async () => {
    const p = s.product(ORG_A, 'shirt', 'ACTIVE'); s.variant(ORG_A, p, 500)
    // no location seeded
    await expect(svc(ORG_A).createOrder({ items: [{ variantId: 'whatever', quantity: 1 }], customer }))
      .rejects.toThrow(/not accepting orders/i)
  })

  it('rejects an unavailable variant', async () => {
    s.location(ORG_A)
    await expect(svc(ORG_A).createOrder({ items: [{ variantId: 'missing', quantity: 1 }], customer }))
      .rejects.toThrow(/unavailable/i)
  })
})

describe('Public storefront — isolation', () => {
  it('never serves another tenant content', async () => {
    s.activate(ORG_B, 'th_aurora', '{}')
    s.product(ORG_B, 'b-prod', 'ACTIVE')
    s.page(ORG_B, 'b-page', 'PUBLISHED')
    expect(await svc(ORG_A).listProducts()).toHaveLength(0)
    expect((await svc(ORG_A).getStorefront()).theme).toBeNull()
    await expect(svc(ORG_A).getPage('b-page')).rejects.toThrow(/not found/i)
  })
})
