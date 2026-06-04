import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createCategoryService } from '../../services/v1/categories.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  parentId: z.string().optional().nullable(),
})

const UpdateSchema = CreateSchema.partial()

function getService(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createCategoryService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('categories.view'), async (c) => {
    const svc = getService(c)
    if (!svc) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const data = await svc.list(c.req.query('includeInactive') === 'true')
      return c.json(ok(data))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to list categories'), 500)
    }
  })

  .get('/:id', requirePermission('categories.view'), async (c) => {
    const svc = getService(c)
    if (!svc) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await svc.getById(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('CATEGORY_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch category'), 500)
    }
  })

  .post('/', requirePermission('categories.create'), zValidator('json', CreateSchema), async (c) => {
    const svc = getService(c)
    if (!svc) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const data = await svc.create(c.req.valid('json'))
      return c.json(ok(data), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create category'), 500)
    }
  })

  .patch('/:id', requirePermission('categories.update'), zValidator('json', UpdateSchema), async (c) => {
    const svc = getService(c)
    if (!svc) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const data = await svc.update(c.req.param('id'), c.req.valid('json'))
      return c.json(ok(data))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update category'), 500)
    }
  })

  .delete('/:id', requirePermission('categories.archive'), async (c) => {
    const svc = getService(c)
    if (!svc) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      await svc.archive(c.req.param('id'))
      return c.json(ok(null))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to archive category'), 500)
    }
  })

export default app
