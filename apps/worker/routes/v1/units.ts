import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createUnitService } from '../../services/v1/units.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  name: z.string().min(1).max(50),
  shortName: z.string().min(1).max(10),
})
const UpdateSchema = CreateSchema.partial()

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createUnitService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('products.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.list()))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list units'), 500)
    }
  })

  .get('/:id', requirePermission('products.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getById(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('UNIT_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch unit'), 500)
    }
  })

  .post('/', requirePermission('products.create'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.create(c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create unit'), 500)
    }
  })

  .patch('/:id', requirePermission('products.update'), zValidator('json', UpdateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.update(c.req.param('id'), c.req.valid('json'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update unit'), 500)
    }
  })

  .delete('/:id', requirePermission('products.archive'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      await s.delete(c.req.param('id'))
      return c.json(ok(null))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to delete unit'), 500)
    }
  })

export default app
