import { Hono } from 'hono'
import { requirePermission } from '../../middleware/rbac'
import { createFinanceService } from '../../services/v1/finance.service'
import { createPurchasesService } from '../../services/v1/purchases.service'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createFinanceService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/summary', requirePermission('finance.view'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getSummary()))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch finance summary'), 500)
    }
  })

  .get('/pnl', requirePermission('finance.reports'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const { from, to } = c.req.query()
      return c.json(ok(await s.getPnL(from, to)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch P&L'), 500)
    }
  })

  .get('/cash-book', requirePermission('finance.reports'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const { accountId, from, to } = c.req.query()
      return c.json(ok(await s.getCashBook(accountId, from, to)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch cash book'), 500)
    }
  })

  .get('/supplier-due', requirePermission('finance.reports'), async (c) => {
    const tenant = c.get('tenant')
    if (!tenant) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const purchaseSvc = createPurchasesService(c.get('db'), tenant.id)
      const result = await purchaseSvc.listSupplierDues()
      return c.json(ok(result))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch supplier dues'), 500)
    }
  })

export default app
