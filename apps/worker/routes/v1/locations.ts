import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createLocationService } from '../../services/v1/locations.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const BranchCreateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
})
const BranchUpdateSchema = BranchCreateSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

const LocationCreateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  branchId: z.string().optional(),
})
const LocationUpdateSchema = LocationCreateSchema.partial().extend({
  branchId: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createLocationService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  // ── Branches ────────────────────────────────────────────────────────────────

  .get('/branches', requirePermission('warehouses.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listBranches(c.req.query('includeInactive') === 'true')))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list branches'), 500)
    }
  })

  .get('/branches/:id', requirePermission('warehouses.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getBranchById(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('BRANCH_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch branch'), 500)
    }
  })

  .post('/branches', requirePermission('warehouses.create'), zValidator('json', BranchCreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.createBranch(c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create branch'), 500)
    }
  })

  .patch('/branches/:id', requirePermission('warehouses.update'), zValidator('json', BranchUpdateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.updateBranch(c.req.param('id'), c.req.valid('json'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update branch'), 500)
    }
  })

  // ── Warehouses ───────────────────────────────────────────────────────────────

  .get('/warehouses', requirePermission('warehouses.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listLocations('WAREHOUSE', c.req.query('includeInactive') === 'true')))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list warehouses'), 500)
    }
  })

  .get('/warehouses/:id', requirePermission('warehouses.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getLocationById(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('LOCATION_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch warehouse'), 500)
    }
  })

  .post('/warehouses', requirePermission('warehouses.create'), zValidator('json', LocationCreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.createWarehouse(c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create warehouse'), 500)
    }
  })

  .patch('/warehouses/:id', requirePermission('warehouses.update'), zValidator('json', LocationUpdateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.updateLocation(c.req.param('id'), c.req.valid('json'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update warehouse'), 500)
    }
  })

  // ── Outlets ───────────────────────────────────────────────────────────────────

  .get('/outlets', requirePermission('outlets.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.listLocations('OUTLET', c.req.query('includeInactive') === 'true')))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list outlets'), 500)
    }
  })

  .get('/outlets/:id', requirePermission('outlets.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getLocationById(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('LOCATION_NOT_FOUND', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch outlet'), 500)
    }
  })

  .post('/outlets', requirePermission('outlets.create'), zValidator('json', LocationCreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.createOutlet(c.req.valid('json'))), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create outlet'), 500)
    }
  })

  .patch('/outlets/:id', requirePermission('outlets.update'), zValidator('json', LocationUpdateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.updateLocation(c.req.param('id'), c.req.valid('json'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to update outlet'), 500)
    }
  })

export default app
