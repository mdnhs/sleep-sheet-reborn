import { describe, it, expect, beforeEach } from 'vitest'
import {
  organization, customer, customerGroup, customerWalletTransaction, customerLoyaltyTransaction,
  order, posSale,
} from '@repo/database/src/schema'
import { createCustomersRepository } from '../../apps/worker/repositories/customers.repository'
import { createCustomerGroupsRepository } from '../../apps/worker/repositories/customer-groups.repository'
import { createCustomersService } from '../../apps/worker/services/v1/customers.service'
import {
  createTestDb, makeOrg, makeGroup, makeCustomer, makeOrder, makePosSale, type TestDb,
} from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
})

// ─── Isolation ──────────────────────────────────────────────────────────────────

describe('Customer & group isolation', () => {
  beforeEach(async () => {
    await db.insert(customerGroup).values([makeGroup('g-a', ORG_A, 'VIP'), makeGroup('g-b', ORG_B, 'Gold')])
    await db.insert(customer).values([
      makeCustomer('c-a', ORG_A, 'Alice', '01700'),
      makeCustomer('c-b', ORG_B, 'Bob', '01800'),
    ])
  })

  it('customer repo A sees only org A', async () => {
    const repo = createCustomersRepository(db as any, ORG_A)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_A)
  })

  it('customer findById cross-tenant returns null', async () => {
    const repo = createCustomersRepository(db as any, ORG_A)
    expect(await repo.findById('c-b')).toBeNull()
  })

  it('customer findByPhone cross-tenant returns null', async () => {
    const repo = createCustomersRepository(db as any, ORG_A)
    expect(await repo.findByPhone('01800')).toBeNull()
  })

  it('group repo B sees only org B', async () => {
    const repo = createCustomerGroupsRepository(db as any, ORG_B)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('group findById cross-tenant returns null', async () => {
    const repo = createCustomerGroupsRepository(db as any, ORG_A)
    expect(await repo.findById('g-b')).toBeNull()
  })

  it('customer update cross-tenant is a no-op', async () => {
    const repoA = createCustomersRepository(db as any, ORG_A)
    const repoB = createCustomersRepository(db as any, ORG_B)
    await repoA.update('c-b', { name: 'Hacked' })
    expect((await repoB.findById('c-b'))?.name).toBe('Bob')
  })

  it('same phone allowed across different organizations', async () => {
    const svcA = createCustomersService(db as any, ORG_A)
    const svcB = createCustomersService(db as any, ORG_B)
    await svcA.createCustomer({ name: 'X', phone: '01999' })
    await expect(svcB.createCustomer({ name: 'Y', phone: '01999' })).resolves.toBeTruthy()
  })
})

// ─── Customer create / uniqueness ─────────────────────────────────────────────────

describe('Customer create rules', () => {
  it('duplicate phone in same org is rejected', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.createCustomer({ name: 'Alice', phone: '01700' })
    await expect(svc.createCustomer({ name: 'Alice2', phone: '01700' })).rejects.toThrow(/already exists/)
  })

  it('duplicate group name in same org is rejected', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.createGroup({ name: 'VIP' })
    await expect(svc.createGroup({ name: 'VIP' })).rejects.toThrow(/already exists/)
  })

  it('group with unknown id on create is rejected', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await expect(svc.createCustomer({ name: 'A', phone: '0170', groupId: 'nope' })).rejects.toThrow(/group not found/i)
  })
})

// ─── Wallet ─────────────────────────────────────────────────────────────────────

describe('Wallet', () => {
  let id: string
  beforeEach(async () => {
    const svc = createCustomersService(db as any, ORG_A)
    const c = await svc.createCustomer({ name: 'Alice', phone: '01700' })
    id = c.id
  })

  it('credit increases balance and records balanceAfter', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    const txn = await svc.creditWallet(id, { amount: 500 })
    expect(txn.balanceAfter).toBe(500)
    const { balance } = await svc.getWallet(id)
    expect(balance).toBe(500)
  })

  it('debit decreases balance', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.creditWallet(id, { amount: 500 })
    await svc.debitWallet(id, { amount: 200 })
    const { balance } = await svc.getWallet(id)
    expect(balance).toBe(300)
  })

  it('debit beyond balance is rejected (no negative wallet)', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.creditWallet(id, { amount: 100 })
    await expect(svc.debitWallet(id, { amount: 200 })).rejects.toThrow(/insufficient/i)
  })

  it('blocked customer cannot debit wallet', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.creditWallet(id, { amount: 500 })
    await svc.setStatus(id, 'BLOCKED')
    await expect(svc.debitWallet(id, { amount: 100 })).rejects.toThrow(/BLOCKED/)
  })

  it('wallet transactions are org-scoped', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.creditWallet(id, { amount: 500 })
    const rowsB = await db.select().from(customerWalletTransaction)
      .where(eqOrg(ORG_B))
    expect(rowsB).toHaveLength(0)
  })
})

// ─── Loyalty ────────────────────────────────────────────────────────────────────

describe('Loyalty', () => {
  let id: string
  beforeEach(async () => {
    const svc = createCustomersService(db as any, ORG_A)
    const c = await svc.createCustomer({ name: 'Alice', phone: '01700' })
    id = c.id
  })

  it('earn increases points', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.earnPoints(id, { points: 100 })
    const { points } = await svc.getLoyalty(id)
    expect(points).toBe(100)
  })

  it('redeem beyond balance is rejected', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.earnPoints(id, { points: 50 })
    await expect(svc.redeemPoints(id, { points: 100 })).rejects.toThrow(/insufficient/i)
  })

  it('reverse clamps to available balance and never goes negative', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.earnPoints(id, { points: 30 })
    const txn = await svc.reversePoints(id, { points: 100 })
    expect(txn.points).toBe(30)
    expect(txn.balanceAfter).toBe(0)
    const { points } = await svc.getLoyalty(id)
    expect(points).toBe(0)
  })

  it('blocked customer cannot redeem points', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    await svc.earnPoints(id, { points: 100 })
    await svc.setStatus(id, 'BLOCKED')
    await expect(svc.redeemPoints(id, { points: 10 })).rejects.toThrow(/BLOCKED/)
  })
})

// ─── Purchase history ─────────────────────────────────────────────────────────────

describe('Purchase history', () => {
  it('aggregates orders + completed POS sales for the customer', async () => {
    const svc = createCustomersService(db as any, ORG_A)
    const c = await svc.createCustomer({ name: 'Alice', phone: '01700' })
    await db.insert(order).values([
      makeOrder('o1', ORG_A, c.id, 'ORD-1', 1000),
      makeOrder('o2', ORG_A, c.id, 'ORD-2', 500),
    ])
    await db.insert(posSale).values([
      makePosSale('s1', ORG_A, c.id, 'POS-1', 300, 'COMPLETED'),
      makePosSale('s2', ORG_A, c.id, 'POS-2', 999, 'DRAFT'), // excluded — not completed
    ])
    const { stats } = await svc.getPurchaseHistory(c.id)
    expect(stats.totalOrders).toBe(3) // 2 orders + 1 completed sale
    expect(stats.totalSpent).toBe(1800)
    expect(stats.averageOrderValue).toBe(600)
  })

  it('excludes another tenant orders from stats', async () => {
    const svcA = createCustomersService(db as any, ORG_A)
    const c = await svcA.createCustomer({ name: 'Alice', phone: '01700' })
    // an order tagged with same customerId but under ORG_B must not leak
    await db.insert(order).values([makeOrder('o-b', ORG_B, c.id, 'ORD-B', 9999)])
    const { stats } = await svcA.getPurchaseHistory(c.id)
    expect(stats.totalSpent).toBe(0)
  })
})

// ─── helper ───────────────────────────────────────────────────────────────────────
import { eq } from 'drizzle-orm'
function eqOrg(orgId: string) {
  return eq(customerWalletTransaction.organizationId, orgId)
}
