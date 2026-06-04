import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createProductService } from '../../services/v1/products.service'
import { createProductVariantService } from '../../services/v1/product-variants.service'
import { isServiceError } from '../../utils/service-error'
import { ok, paginated, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
})

const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
})

const CreateVariantSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).optional(),
  unitId: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
})

const UpdateVariantSchema = CreateVariantSchema.partial().extend({
  barcode: z.string().max(100).nullable().optional(),
  unitId: z.string().nullable().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createProductService(c.get('db'), tenant.id)
}

function variantSvc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createProductVariantService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  // ── Product collection ──────────────────────────────────────────────────────

  .get('/', requirePermission('products.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
      const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
      const query = {
        status: c.req.query('status') as any,
        categoryId: c.req.query('categoryId'),
        brandId: c.req.query('brandId'),
        search: c.req.query('search'),
        limit,
        offset: (page - 1) * limit,
      }
      const { rows, total } = await s.list(query)
      return c.json(paginated(rows, page, limit, total))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list products'), 500)
    }
  })

  .get('/:id', requirePermission('products.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getById(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('PRODUCT_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch product'), 500)
    }
  })

  .post('/', requirePermission('products.create'), zValidator('json', CreateProductSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.create(c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create product'), 500)
    }
  })

  .patch('/:id', requirePermission('products.update'), zValidator('json', UpdateProductSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.update(c.req.param('id'), c.req.valid('json'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update product'), 500)
    }
  })

  .delete('/:id', requirePermission('products.archive'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.archive(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to archive product'), 500)
    }
  })

  // ── Variants (nested under product) ────────────────────────────────────────

  .get('/:id/variants', requirePermission('products.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listVariants(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to list variants'), 500)
    }
  })

  .post('/:id/variants', requirePermission('products.create'), zValidator('json', CreateVariantSchema), async (c) => {
    const vs = variantSvc(c)
    if (!vs) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await vs.create(c.req.param('id'), c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create variant'), 500)
    }
  })

  .patch('/:id/variants/:variantId', requirePermission('products.update'), zValidator('json', UpdateVariantSchema), async (c) => {
    const vs = variantSvc(c)
    if (!vs) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await vs.update(c.req.param('variantId'), c.req.valid('json'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update variant'), 500)
    }
  })

  .delete('/:id/variants/:variantId', requirePermission('products.archive'), async (c) => {
    const vs = variantSvc(c)
    if (!vs) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      await vs.deactivate(c.req.param('variantId'))
      return c.json(ok(null))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to deactivate variant'), 500)
    }
  })

export default app
