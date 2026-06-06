import { describe, it, expect, beforeEach } from 'vitest'
import { organization, order, orderPayment } from '@repo/database/src/schema'
import { eq } from 'drizzle-orm'
import { createOrderPaymentService, handleOrderPaymentWebhook } from '../../apps/worker/services/public/payments.service'
import { createTestDb, makeOrg, makeOrder, type TestDb } from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'
const initSvc = (org: string) => createOrderPaymentService(db as any, org)

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'a'), makeOrg(ORG_B, 'b')])
})

async function paymentOf(orderId: string) {
  return db.select().from(orderPayment).where(eq(orderPayment.orderId, orderId)).then(r => r[0])
}
async function orderOf(id: string) {
  return db.select().from(order).where(eq(order.id, id)).then(r => r[0])
}

describe('Order payment — initiate', () => {
  beforeEach(async () => { await db.insert(order).values([makeOrder('o1', ORG_A, 2500)]) })

  it('creates a PENDING payment for the order grand total', async () => {
    const r = await initSvc(ORG_A).initiate('o1', 'bKash')
    expect(r.amount).toBe(2500)
    const p = await paymentOf('o1')
    expect(p.status).toBe('PENDING')
    expect(p.provider).toBe('bKash')
  })

  it('rejects invalid provider', async () => {
    await expect(initSvc(ORG_A).initiate('o1', 'PayPal')).rejects.toThrow(/invalid payment provider/i)
  })

  it('rejects an already-paid order', async () => {
    await db.insert(order).values([makeOrder('paid', ORG_A, 100, 'PAID')])
    await expect(initSvc(ORG_A).initiate('paid', 'bKash')).rejects.toThrow(/already paid/i)
  })

  it('cross-tenant order is not found', async () => {
    await expect(initSvc(ORG_B).initiate('o1', 'bKash')).rejects.toThrow(/not found/i)
  })
})

describe('Order payment — webhook', () => {
  let paymentId: string
  beforeEach(async () => {
    await db.insert(order).values([makeOrder('o1', ORG_A, 2500)])
    const r = await initSvc(ORG_A).initiate('o1', 'bKash')
    paymentId = r.paymentId
  })

  it('success marks payment PAID and order paymentStatus PAID', async () => {
    await handleOrderPaymentWebhook(db as any, 'bKash', { paymentId, providerRef: 'TXN1', status: 'success', idempotencyKey: 'evt-1' })
    expect((await paymentOf('o1')).status).toBe('PAID')
    expect((await orderOf('o1')).paymentStatus).toBe('PAID')
  })

  it('is idempotent — duplicate event is a no-op', async () => {
    const payload = { paymentId, providerRef: 'TXN1', status: 'success' as const, idempotencyKey: 'evt-1' }
    await handleOrderPaymentWebhook(db as any, 'bKash', payload)
    const second = await handleOrderPaymentWebhook(db as any, 'bKash', payload)
    expect(second.duplicate).toBe(true)
    expect((await orderOf('o1')).paymentStatus).toBe('PAID')
  })

  it('failed marks payment + order FAILED', async () => {
    await handleOrderPaymentWebhook(db as any, 'bKash', { paymentId, providerRef: 'X', status: 'failed', idempotencyKey: 'evt-2' })
    expect((await paymentOf('o1')).status).toBe('FAILED')
    expect((await orderOf('o1')).paymentStatus).toBe('FAILED')
  })

  it('rejects malformed payload', async () => {
    await expect(handleOrderPaymentWebhook(db as any, 'bKash', { paymentId } as any)).rejects.toThrow(/invalid webhook/i)
  })

  it('rejects unknown provider', async () => {
    await expect(handleOrderPaymentWebhook(db as any, 'Stripe', { paymentId, providerRef: 'x', status: 'success', idempotencyKey: 'e' }))
      .rejects.toThrow(/unknown provider/i)
  })

  it('enforces signature when a secret is configured', async () => {
    const bad = { paymentId, providerRef: 'TXN', status: 'success' as const, idempotencyKey: 'evt-9', signature: 'wrong' }
    await expect(handleOrderPaymentWebhook(db as any, 'bKash', bad, 'sekret')).rejects.toThrow(/invalid webhook/i)
    const good = { ...bad, idempotencyKey: 'evt-10', signature: `${paymentId}:TXN:success:sekret` }
    const r = await handleOrderPaymentWebhook(db as any, 'bKash', good, 'sekret')
    expect(r.status).toBe('PAID')
  })
})
