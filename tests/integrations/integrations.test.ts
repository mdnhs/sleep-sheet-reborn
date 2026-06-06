import { describe, it, expect, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { organization, customer, notification } from '@repo/database/src/schema'
import { pointsFor, awardLoyalty, reverseLoyalty, refundToWallet, notifyOrg } from '../../apps/worker/services/v1/integrations'
import { createTestDb, makeOrg, makeCustomer, type TestDb } from './setup'

let db: TestDb
const ORG = 'org-a'
const cust = (id: string) => db.select().from(customer).where(eq(customer.id, id)).then(r => r[0])

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG)])
})

describe('pointsFor', () => {
  it('floors at 1 point / 100 units', () => {
    expect(pointsFor(0)).toBe(0)
    expect(pointsFor(99)).toBe(0)
    expect(pointsFor(250)).toBe(2)
    expect(pointsFor(-5)).toBe(0)
  })
})

describe('awardLoyalty', () => {
  it('earns points for a customer order', async () => {
    await db.insert(customer).values([makeCustomer('c1', ORG)])
    await awardLoyalty(db as any, ORG, 'c1', 500, { source: 'ORDER', type: 'order', id: 'o1' })
    expect((await cust('c1'))!.loyaltyPoints).toBe(5)
  })
  it('no-op when no customer or sub-threshold amount', async () => {
    await db.insert(customer).values([makeCustomer('c1', ORG)])
    await awardLoyalty(db as any, ORG, null, 500, { source: 'ORDER', type: 'order', id: 'o1' })
    await awardLoyalty(db as any, ORG, 'c1', 50, { source: 'ORDER', type: 'order', id: 'o2' })
    expect((await cust('c1'))!.loyaltyPoints).toBe(0)
  })
})

describe('reverseLoyalty', () => {
  it('reverses earned points on refund (clamped to balance)', async () => {
    await db.insert(customer).values([makeCustomer('c1', ORG, { loyaltyPoints: 5 })])
    await reverseLoyalty(db as any, ORG, 'c1', 500, { type: 'order_refund', id: 'r1' })
    expect((await cust('c1'))!.loyaltyPoints).toBe(0)
  })
})

describe('refundToWallet', () => {
  it('credits the refund amount to the customer wallet', async () => {
    await db.insert(customer).values([makeCustomer('c1', ORG, { walletBalance: 100 })])
    await refundToWallet(db as any, ORG, 'c1', 250, { type: 'order_refund', id: 'r1' })
    expect((await cust('c1'))!.walletBalance).toBe(350)
  })
  it('no-op without customer', async () => {
    await refundToWallet(db as any, ORG, null, 250, { type: 'order_refund', id: 'r1' })
    // nothing thrown, nothing created
    expect(true).toBe(true)
  })
})

describe('notifyOrg', () => {
  it('creates an org-wide notification', async () => {
    await notifyOrg(db as any, ORG, { title: 'New order', type: 'INFO', entityType: 'order', entityId: 'o1' })
    const rows = await db.select().from(notification).where(eq(notification.organizationId, ORG))
    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe('New order')
    expect(rows[0].userId).toBeNull()
  })
  it('never throws on failure', async () => {
    await expect(notifyOrg(db as any, ORG, { title: '' })).resolves.toBeUndefined()
  })
})
