import { eq, and } from 'drizzle-orm'
import { demoDataset, demoImport, demoImportItem, category, product, productVariant } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { createCategoryRepository } from '../../repositories/categories.repository'
import { createProductRepository } from '../../repositories/products.repository'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { enforceLimit } from '../../utils/plan-limits'
import { ServiceError } from '../../utils/service-error'
import { generateId } from '../../utils/id'

type Payload = {
  categories?: Array<{ name: string; slug: string }>
  products?: Array<{ name: string; slug: string; category?: string; sku: string; price?: number }>
}

/** Tenant-scoped demo data import. Imports run through the normal repos and are fully revertable. */
export function createDemoService(db: Database, organizationId: string) {
  const categories = createCategoryRepository(db, organizationId)
  const products = createProductRepository(db, organizationId)
  const variants = createProductVariantRepository(db, organizationId)
  const audit = createAuditLogRepository(db, organizationId)
  const orgScope = (col: any) => eq(col, organizationId)

  return {
    listDatasets() {
      return db.select().from(demoDataset).where(eq(demoDataset.status, 'ACTIVE')).orderBy(demoDataset.name)
    },

    listImports() {
      return db.select().from(demoImport).where(eq(demoImport.organizationId, organizationId)).orderBy(demoImport.createdAt)
    },

    async import(datasetId: string, actorId?: string) {
      const ds = await db.select().from(demoDataset).where(eq(demoDataset.id, datasetId)).then(r => r[0])
      if (!ds || ds.status !== 'ACTIVE') throw new ServiceError('Demo dataset not found', 404)
      let payload: Payload
      try { payload = JSON.parse(ds.payload) } catch { throw new ServiceError('Dataset payload is invalid', 500) }

      const now = new Date()
      const importId = generateId()
      const tag = importId.slice(0, 6)
      const items: Array<{ entityType: 'category' | 'product' | 'product_variant'; entityId: string }> = []

      // Categories (slug suffixed so re-imports never collide)
      const catBySlug = new Map<string, string>()
      for (const c of payload.categories ?? []) {
        const row = await categories.create({ name: c.name, slug: `${c.slug}-${tag}`, status: 'ACTIVE', parentId: null } as any)
        catBySlug.set(c.slug, row.id)
        items.push({ entityType: 'category', entityId: row.id })
      }

      // Products + a default variant; plan-capped per product
      let created = 0
      const existing = await products.count({ status: 'ACTIVE' })
      for (const p of payload.products ?? []) {
        await enforceLimit(db, organizationId, 'limitProducts', existing + created)
        const prod = await products.create({
          name: p.name, slug: `${p.slug}-${tag}`, description: null, status: 'ACTIVE',
          categoryId: p.category ? catBySlug.get(p.category) ?? null : null, brandId: null,
        } as any)
        items.push({ entityType: 'product', entityId: prod.id })
        const v = await variants.create({
          productId: prod.id, unitId: null, sku: `${p.sku}-${tag}`, barcode: null,
          name: p.name, costPrice: 0, sellingPrice: p.price ?? 0, status: 'ACTIVE',
        } as any)
        items.push({ entityType: 'product_variant', entityId: v.id })
        created++
      }

      const catCount = (payload.categories ?? []).length
      await db.insert(demoImport).values({
        id: importId, organizationId, datasetId, datasetName: ds.name, status: 'COMPLETED',
        categoryCount: catCount, productCount: created, createdAt: now, updatedAt: now,
      })
      if (items.length) {
        await db.insert(demoImportItem).values(items.map(i => ({ id: generateId(), organizationId, importId, entityType: i.entityType, entityId: i.entityId, createdAt: now })))
      }
      await audit.log('demo_import', importId, 'import', actorId, { datasetId, categories: catCount, products: created })
      return { id: importId, datasetName: ds.name, categoryCount: catCount, productCount: created }
    },

    /** Hard-delete exactly what an import created, then mark it cleared. */
    async clear(importId: string, actorId?: string) {
      const imp = await db.select().from(demoImport)
        .where(and(eq(demoImport.organizationId, organizationId), eq(demoImport.id, importId))).then(r => r[0])
      if (!imp) throw new ServiceError('Import not found', 404)
      if (imp.status === 'CLEARED') throw new ServiceError('Import already cleared', 400)

      const rows = await db.select().from(demoImportItem)
        .where(and(eq(demoImportItem.organizationId, organizationId), eq(demoImportItem.importId, importId)))

      // Delete variants → products → categories (children first)
      const order: Record<string, number> = { product_variant: 0, product: 1, category: 2 }
      const sorted = [...rows].sort((a, b) => order[a.entityType] - order[b.entityType])
      for (const r of sorted) {
        if (r.entityType === 'product_variant') await db.delete(productVariant).where(and(orgScope(productVariant.organizationId), eq(productVariant.id, r.entityId)))
        else if (r.entityType === 'product') await db.delete(product).where(and(orgScope(product.organizationId), eq(product.id, r.entityId)))
        else if (r.entityType === 'category') await db.delete(category).where(and(orgScope(category.organizationId), eq(category.id, r.entityId)))
      }
      await db.delete(demoImportItem).where(and(eq(demoImportItem.organizationId, organizationId), eq(demoImportItem.importId, importId)))
      await db.update(demoImport).set({ status: 'CLEARED', updatedAt: new Date() }).where(eq(demoImport.id, importId))
      await audit.log('demo_import', importId, 'clear', actorId, { removed: rows.length })
      return { id: importId, removed: rows.length }
    },
  }
}

export type DemoService = ReturnType<typeof createDemoService>

/** Platform-scope demo dataset catalog management (SUPER_ADMIN). */
export function createDemoAdminService(db: Database) {
  return {
    list() { return db.select().from(demoDataset).orderBy(demoDataset.name) },
    async create(data: { name: string; businessType?: string; description?: string; payload: unknown }) {
      const now = new Date()
      const row = {
        id: generateId(), name: data.name, businessType: data.businessType ?? null, description: data.description ?? null,
        payload: typeof data.payload === 'string' ? data.payload : JSON.stringify(data.payload ?? {}),
        status: 'ACTIVE' as const, createdAt: now, updatedAt: now,
      }
      await db.insert(demoDataset).values(row)
      return row
    },
    async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
      const ds = await db.select().from(demoDataset).where(eq(demoDataset.id, id)).then(r => r[0])
      if (!ds) throw new ServiceError('Dataset not found', 404)
      await db.update(demoDataset).set({ status, updatedAt: new Date() }).where(eq(demoDataset.id, id))
      return { id, status }
    },
  }
}
