import { describe, it, expect, beforeEach } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { category, product, productVariant, demoImport } from '@repo/database/src/schema'
import { createDemoService } from '../../apps/worker/services/v1/demo.service'
import { createTestDb, seedPlan } from './setup'

let ctx: ReturnType<typeof createTestDb>
const svc = (org: string) => createDemoService(ctx.db as any, org)
const ORG_A = 'org-a'
const ORG_B = 'org-b'
const countProducts = (org: string) => ctx.db.select().from(product).where(eq(product.organizationId, org)).then(r => r.length)

beforeEach(() => { ctx = createTestDb() })

describe('Demo import', () => {
  it('imports categories + products + variants and records the import', async () => {
    const r = await svc(ORG_A).import('ds1')
    expect(r.categoryCount).toBe(2)
    expect(r.productCount).toBe(2)
    expect(await countProducts(ORG_A)).toBe(2)
    expect(await ctx.db.select().from(category).where(eq(category.organizationId, ORG_A)).then(x => x.length)).toBe(2)
    expect(await ctx.db.select().from(productVariant).where(eq(productVariant.organizationId, ORG_A)).then(x => x.length)).toBe(2)
    // products linked to imported categories
    const prods = await ctx.db.select().from(product).where(eq(product.organizationId, ORG_A))
    expect(prods.every(p => p.categoryId)).toBe(true)
  })

  it('unknown dataset is 404', async () => {
    await expect(svc(ORG_A).import('nope')).rejects.toThrow(/not found/i)
  })

  it('re-import does not collide (suffixed slugs)', async () => {
    await svc(ORG_A).import('ds1')
    await svc(ORG_A).import('ds1')
    expect(await countProducts(ORG_A)).toBe(4)
  })

  it('respects the product plan limit', async () => {
    seedPlan(ctx.sqlite, ORG_A, 1) // cap at 1 product
    await expect(svc(ORG_A).import('ds1')).rejects.toThrow(/PLAN_LIMIT/)
    // first product created before the cap tripped on the second
    expect(await countProducts(ORG_A)).toBe(1)
  })
})

describe('Demo clear', () => {
  it('removes exactly what the import created and marks it CLEARED', async () => {
    const r = await svc(ORG_A).import('ds1')
    const cleared = await svc(ORG_A).clear(r.id)
    expect(cleared.removed).toBe(6) // 2 categories + 2 products + 2 variants
    expect(await countProducts(ORG_A)).toBe(0)
    expect(await ctx.db.select().from(category).where(eq(category.organizationId, ORG_A)).then(x => x.length)).toBe(0)
    const imp = await ctx.db.select().from(demoImport).where(eq(demoImport.id, r.id)).then(x => x[0])
    expect(imp.status).toBe('CLEARED')
  })

  it('second clear is rejected', async () => {
    const r = await svc(ORG_A).import('ds1')
    await svc(ORG_A).clear(r.id)
    await expect(svc(ORG_A).clear(r.id)).rejects.toThrow(/already cleared/i)
  })
})

describe('Demo isolation', () => {
  it('an import is not visible to / clearable by another tenant', async () => {
    const r = await svc(ORG_A).import('ds1')
    expect(await svc(ORG_B).listImports()).toHaveLength(0)
    await expect(svc(ORG_B).clear(r.id)).rejects.toThrow(/not found/i)
    expect(await countProducts(ORG_A)).toBe(2) // untouched
  })
})
