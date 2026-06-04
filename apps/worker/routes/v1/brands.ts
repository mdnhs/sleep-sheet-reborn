import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createBrandService } from '../../services/v1/brands.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})
const UpdateSchema = CreateSchema.partial()

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createBrandService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('products.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.list(c.req.query('includeInactive') === 'true')))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to list brands'), 500)
    }
  })

  .get('/:id', requirePermission('products.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getById(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('BRAND_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch brand'), 500)
    }
  })

  .post('/', requirePermission('products.create'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.create(c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create brand'), 500)
    }
  })

  .patch('/:id', requirePermission('products.update'), zValidator('json', UpdateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.update(c.req.param('id'), c.req.valid('json'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update brand'), 500)
    }
  })

  .delete('/:id', requirePermission('products.archive'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      await s.archive(c.req.param('id'))
      return c.json(ok(null))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to archive brand'), 500)
    }
  })

export default app
