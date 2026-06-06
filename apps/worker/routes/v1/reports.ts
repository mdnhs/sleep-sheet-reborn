import { Hono } from 'hono'
import { requirePermission } from '../../middleware/rbac'
import { createReportsService } from '../../services/v1/reports.service'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createReportsService(c.get('db'), tenant.id)
}
const q = (c: any) => ({ from: c.req.query('from'), to: c.req.query('to') })

const app = new Hono<HonoEnv>()
  // ── Sales ───────────────────────────────────────────────────────────────────────
  .get('/sales/summary', requirePermission('reports.sales'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { from, to } = q(c)
    try { return c.json(ok(await s.salesSummary(from, to))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build sales summary'), 500) }
  })
  .get('/sales/time-series', requirePermission('reports.sales'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { from, to } = q(c)
    const g = (c.req.query('granularity') ?? 'day') as 'day' | 'month' | 'year'
    const granularity = ['day', 'month', 'year'].includes(g) ? g : 'day'
    try { return c.json(ok(await s.salesTimeSeries(granularity, from, to))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build time series'), 500) }
  })
  .get('/sales/by-channel', requirePermission('reports.sales'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { from, to } = q(c)
    try { return c.json(ok(await s.salesByChannel(from, to))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build channel report'), 500) }
  })
  .get('/sales/top-products', requirePermission('reports.sales'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { from, to } = q(c)
    const limit = Number(c.req.query('limit') ?? 20)
    try { return c.json(ok(await s.topProducts(Number.isFinite(limit) ? limit : 20, from, to))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build top products'), 500) }
  })
  .get('/sales/outlets', requirePermission('reports.sales'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { from, to } = q(c)
    try { return c.json(ok(await s.outletPerformance(from, to))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build outlet report'), 500) }
  })

  // ── Inventory ─────────────────────────────────────────────────────────────────
  .get('/inventory/valuation', requirePermission('reports.inventory'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try { return c.json(ok(await s.inventoryValuation())) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build valuation'), 500) }
  })
  .get('/inventory/low-stock', requirePermission('reports.inventory'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const threshold = Number(c.req.query('threshold') ?? 5)
    try { return c.json(ok(await s.lowStock(Number.isFinite(threshold) ? threshold : 5))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build low-stock report'), 500) }
  })
  .get('/inventory/movements', requirePermission('reports.inventory'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { from, to } = q(c)
    try { return c.json(ok(await s.movementSummary(from, to))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build movement report'), 500) }
  })

  // ── Purchases ───────────────────────────────────────────────────────────────────
  .get('/purchases/summary', requirePermission('reports.purchase'), async (c) => {
    const s = svc(c); if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const { from, to } = q(c)
    try { return c.json(ok(await s.purchaseSummary(from, to))) } catch { return c.json(err('INTERNAL_ERROR', 'Failed to build purchase report'), 500) }
  })

export default app
