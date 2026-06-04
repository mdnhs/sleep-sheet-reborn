import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requirePermission } from '../../middleware/rbac'
import { createPosService } from '../../services/v1/pos.service'
import { isServiceError } from '../../utils/service-error'
import { ok, err } from '../../utils/response'
import type { HonoEnv } from '../../src/types'

const OpenSchema = z.object({
  openingCash: z.number().int().min(0),
})

const CloseSchema = z.object({
  closingCash: z.number().int().min(0),
})

function svc(c: any) {
  const tenant = c.get('tenant')
  if (!tenant) return null
  return createPosService(c.get('db'), tenant.id)
}

const app = new Hono<HonoEnv>()

  .get('/', requirePermission('pos.cash_register'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      const registerId = c.req.query('registerId')
      return c.json(ok(await s.listSessions(registerId)))
    } catch (e) {
      return c.json(err('INTERNAL_ERROR', 'Failed to list sessions'), 500)
    }
  })

  .get('/:id', requirePermission('pos.cash_register'), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    try {
      return c.json(ok(await s.getSession(c.req.param('id'))))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to fetch session'), 500)
    }
  })

  .post('/:registerId/open', requirePermission('pos.cash_register'), zValidator('json', OpenSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      const result = await s.openSession({
        registerId: c.req.param('registerId'),
        openingCash: c.req.valid('json').openingCash,
        actorId: userId,
      })
      return c.json(ok(result), 201)
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to open session'), 500)
    }
  })

  .post('/:id/close', requirePermission('pos.cash_register'), zValidator('json', CloseSchema), async (c) => {
    const s = svc(c)
    if (!s) return c.json(err('TENANT_NOT_FOUND', 'Tenant not found'), 404)
    const userId = c.get('user')?.id ?? ''
    try {
      const result = await s.closeSession({
        sessionId: c.req.param('id'),
        closingCash: c.req.valid('json').closingCash,
        actorId: userId,
      })
      return c.json(ok(result))
    } catch (e) {
      if (isServiceError(e)) return c.json(err('SERVICE_ERROR', e.message), e.status)
      return c.json(err('INTERNAL_ERROR', 'Failed to close session'), 500)
    }
  })

export default app
