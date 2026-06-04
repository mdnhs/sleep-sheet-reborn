import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createFinanceService } from '../../services/v1/finance.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const CreateSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(['SALE', 'PURCHASE_PAYMENT', 'CUSTOMER_PAYMENT', 'REFUND', 'EXPENSE', 'WALLET_CREDIT', 'WALLET_DEBIT', 'ADJUSTMENT']),
  amount: z.number().int().refine(v => v !== 0, 'Amount cannot be zero'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  note: z.string().optional(),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createFinanceService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('finance.transactions'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const { accountId, type, from, to } = c.req.query()
      return c.json(ok(await s.listTransactions({ accountId, type, from, to })))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list transactions'), 500)
    }
  })

  .post('/', requirePermission('finance.transactions'), zValidator('json', CreateSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const result = await s.createTransaction({ ...c.req.valid('json'), actorId: c.get('user')?.id })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to create transaction'), 500)
    }
  })

export default app
