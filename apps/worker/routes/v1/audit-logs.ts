import { Hono } from 'hono'
import { requirePermission } from '../../middleware/rbac'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

function repo(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createAuditLogRepository(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()
  .get('/', requirePermission('audit.view'), async (c) => {
    const r = repo(c); if (!r) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const entityType = c.req.query('entityType')
    const entityId = c.req.query('entityId')
    const limit = Math.min(Number(c.req.query('limit') ?? 100) || 100, 500)
    try {
      const rows = entityType && entityId
        ? await r.findByEntity(entityType, entityId, limit)
        : await r.findByOrg(limit)
      return c.json(ok(rows))
    } catch { return c.json(err('INTERNAL_ERROR', 'Failed to load audit logs'), 500) }
  })

export default app
