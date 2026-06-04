import { describe, it, expect, beforeEach } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { organization, product, productVariant, category, brand } from '@repo/database/src/schema'
import { createCategoryRepository } from '../../apps/worker/repositories/categories.repository'
import { createBrandRepository } from '../../apps/worker/repositories/brands.repository'
import { createProductRepository } from '../../apps/worker/repositories/products.repository'
import { createProductVariantRepository } from '../../apps/worker/repositories/product-variants.repository'
import { createTestDb, makeOrg, makeProduct, makeVariant, makeCategory, makeBrand, type TestDb } from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
})

// ─── Category isolation ──────────────────────────────────────────────────────

describe('Category isolation', () => {
  beforeEach(async () => {
    await db.insert(category).values([
      makeCategory('cat-a1', ORG_A, 'electronics'),
      makeCategory('cat-a2', ORG_A, 'grocery'),
      makeCategory('cat-b1', ORG_B, 'electronics'), // same slug — allowed per-org
    ])
  })

  it('repo A sees only org A categories', async () => {
    const repo = createCategoryRepository(db as any, ORG_A)
    const cats = await repo.findMany()
    expect(cats).toHaveLength(2)
    for (const c of cats) expect(c.organizationId).toBe(ORG_A)
  })

  it('repo B sees only org B categories', async () => {
    const repo = createCategoryRepository(db as any, ORG_B)
    const cats = await repo.findMany()
    expect(cats).toHaveLength(1)
    expect(cats[0].organizationId).toBe(ORG_B)
  })

  it('same slug allowed in two orgs', async () => {
    // both org-a and org-b have slug "electronics" — no error thrown
    const catA = await db.query.category.findFirst({ where: and(eq(category.organizationId, ORG_A), eq(category.slug, 'electronics')) })
    const catB = await db.query.category.findFirst({ where: and(eq(category.organizationId, ORG_B), eq(category.slug, 'electronics')) })
    expect(catA).toBeDefined()
    expect(catB).toBeDefined()
    expect(catA!.id).not.toBe(catB!.id)
  })

  it('duplicate slug within same org rejected', async () => {
    await expect(
      db.insert(category).values(makeCategory('dup', ORG_A, 'electronics'))
    ).rejects.toThrow()
  })

  it('findBySlug from org A does not find org B category', async () => {
    const repo = createCategoryRepository(db as any, ORG_A)
    const found = await repo.findBySlug('electronics')
    expect(found?.organizationId).toBe(ORG_A)
  })
})

// ─── Brand isolation ─────────────────────────────────────────────────────────

describe('Brand isolation', () => {
  beforeEach(async () => {
    await db.insert(brand).values([
      makeBrand('br-a1', ORG_A, 'nestleé'),
      makeBrand('br-b1', ORG_B, 'nestleé'), // same slug, different org
    ])
  })

  it('repo A sees only org A brands', async () => {
    const repo = createBrandRepository(db as any, ORG_A)
    const brands = await repo.findMany()
    expect(brands).toHaveLength(1)
    expect(brands[0].organizationId).toBe(ORG_A)
  })

  it('repo B sees only org B brands', async () => {
    const repo = createBrandRepository(db as any, ORG_B)
    const brands = await repo.findMany()
    expect(brands).toHaveLength(1)
    expect(brands[0].organizationId).toBe(ORG_B)
  })

  it('duplicate slug within same org rejected', async () => {
    await expect(
      db.insert(brand).values(makeBrand('dup', ORG_A, 'nestleé'))
    ).rejects.toThrow()
  })
})

// ─── Product isolation ───────────────────────────────────────────────────────

describe('Product isolation', () => {
  beforeEach(async () => {
    await db.insert(product).values([
      makeProduct('prod-a1', ORG_A, 'rice-1kg'),
      makeProduct('prod-a2', ORG_A, 'oil-2l'),
      makeProduct('prod-b1', ORG_B, 'rice-1kg'), // same slug, different org
    ])
  })

  it('repo A sees only org A products', async () => {
    const repo = createProductRepository(db as any, ORG_A)
    const rows = await repo.findMany({})
    expect(rows.length).toBe(2)
    for (const r of rows) expect(r.product.organizationId).toBe(ORG_A)
  })

  it('repo B sees only org B products', async () => {
    const repo = createProductRepository(db as any, ORG_B)
    const rows = await repo.findMany({})
    expect(rows.length).toBe(1)
    expect(rows[0].product.organizationId).toBe(ORG_B)
  })

  it('findById from org A cannot see org B product', async () => {
    const repo = createProductRepository(db as any, ORG_A)
    const found = await repo.findById('prod-b1')
    expect(found).toBeNull()
  })

  it('findBySlug from org A returns org A product', async () => {
    const repo = createProductRepository(db as any, ORG_A)
    const found = await repo.findBySlug('rice-1kg')
    // findBySlug returns a plain product row (no join)
    expect(found?.organizationId).toBe(ORG_A)
  })

  it('same slug in two orgs is allowed', async () => {
    const a = await db.query.product.findFirst({ where: and(eq(product.organizationId, ORG_A), eq(product.slug, 'rice-1kg')) })
    const b = await db.query.product.findFirst({ where: and(eq(product.organizationId, ORG_B), eq(product.slug, 'rice-1kg')) })
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a!.id).not.toBe(b!.id)
  })

  it('duplicate slug within same org rejected', async () => {
    await expect(
      db.insert(product).values(makeProduct('dup', ORG_A, 'rice-1kg'))
    ).rejects.toThrow()
  })

  it('countByOrg returns only own active products', async () => {
    const repoA = createProductRepository(db as any, ORG_A)
    const repoB = createProductRepository(db as any, ORG_B)
    expect(await repoA.countByOrg()).toBe(2)
    expect(await repoB.countByOrg()).toBe(1)
  })
})

// ─── Variant isolation ───────────────────────────────────────────────────────

describe('Product Variant isolation', () => {
  beforeEach(async () => {
    await db.insert(product).values([
      makeProduct('prod-a', ORG_A, 'rice'),
      makeProduct('prod-b', ORG_B, 'rice'),
    ])
    await db.insert(productVariant).values([
      makeVariant('var-a1', ORG_A, 'prod-a', 'RICE-001'),
      makeVariant('var-a2', ORG_A, 'prod-a', 'RICE-002'),
      makeVariant('var-b1', ORG_B, 'prod-b', 'RICE-001'), // same SKU, different org
    ])
  })

  it('repo A sees only org A variants for a product', async () => {
    const repo = createProductVariantRepository(db as any, ORG_A)
    const vars = await repo.findByProduct('prod-a')
    expect(vars).toHaveLength(2)
    for (const v of vars) expect(v.organizationId).toBe(ORG_A)
  })

  it('repo A cannot find org B variant by SKU', async () => {
    const repo = createProductVariantRepository(db as any, ORG_A)
    const found = await repo.findBySku('RICE-001')
    expect(found?.organizationId).toBe(ORG_A)
  })

  it('same SKU allowed in two different orgs', async () => {
    const a = await db.query.productVariant.findFirst({ where: and(eq(productVariant.organizationId, ORG_A), eq(productVariant.sku, 'RICE-001')) })
    const b = await db.query.productVariant.findFirst({ where: and(eq(productVariant.organizationId, ORG_B), eq(productVariant.sku, 'RICE-001')) })
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a!.id).not.toBe(b!.id)
  })

  it('duplicate SKU within same org rejected', async () => {
    await expect(
      db.insert(productVariant).values(makeVariant('dup', ORG_A, 'prod-a', 'RICE-001'))
    ).rejects.toThrow()
  })

  it('repo A cannot see org B product variants', async () => {
    const repo = createProductVariantRepository(db as any, ORG_A)
    const found = await repo.findById('var-b1')
    expect(found).toBeNull()
  })
})
