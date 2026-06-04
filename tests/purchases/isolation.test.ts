import { describe, it, expect, beforeEach } from 'vitest'
import { organization, product, productVariant, location, supplier, supplierPayment, purchaseOrder } from '@repo/database/src/schema'
import { createSupplierRepository } from '../../apps/worker/repositories/suppliers.repository'
import { createPurchasesRepository } from '../../apps/worker/repositories/purchases.repository'
import {
  createTestDb,
  makeOrg, makeProduct, makeVariant, makeLocation,
  makeSupplier, makeSupplierPayment, makePurchaseOrder,
  type TestDb,
} from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

const LOC_A = 'loc-a'
const LOC_B = 'loc-b'
const PROD_A = 'prod-a'
const PROD_B = 'prod-b'
const VAR_A = 'var-a'
const VAR_B = 'var-b'

beforeEach(async () => {
  db = createTestDb()
  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])
  await db.insert(product).values([makeProduct(PROD_A, ORG_A, 'rice'), makeProduct(PROD_B, ORG_B, 'rice')])
  await db.insert(productVariant).values([makeVariant(VAR_A, ORG_A, PROD_A, 'SKU-A'), makeVariant(VAR_B, ORG_B, PROD_B, 'SKU-B')])
  await db.insert(location).values([makeLocation(LOC_A, ORG_A, 'WH-A'), makeLocation(LOC_B, ORG_B, 'WH-B')])
})

// ─── Supplier isolation ──────────────────────────────────────────────────────

describe('Supplier isolation', () => {
  beforeEach(async () => {
    await db.insert(supplier).values([
      makeSupplier('sup-a1', ORG_A, '01700000001'),
      makeSupplier('sup-a2', ORG_A, '01700000002'),
      makeSupplier('sup-b1', ORG_B, '01700000001'), // same phone, different org — allowed
    ])
  })

  it('repo A sees only org A suppliers', async () => {
    const repo = createSupplierRepository(db as any, ORG_A)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(r.organizationId).toBe(ORG_A)
  })

  it('repo B sees only org B suppliers', async () => {
    const repo = createSupplierRepository(db as any, ORG_B)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('findById from org A cannot see org B supplier', async () => {
    const repo = createSupplierRepository(db as any, ORG_A)
    const found = await repo.findById('sup-b1')
    expect(found).toBeNull()
  })

  it('findByPhone from org A returns org A supplier', async () => {
    const repo = createSupplierRepository(db as any, ORG_A)
    const found = await repo.findByPhone('01700000001')
    expect(found?.organizationId).toBe(ORG_A)
  })

  it('same phone allowed in two different orgs', async () => {
    const a = await db.query.supplier.findFirst({ where: (t, { and, eq }) => and(eq(t.organizationId, ORG_A), eq(t.phone, '01700000001')) })
    const b = await db.query.supplier.findFirst({ where: (t, { and, eq }) => and(eq(t.organizationId, ORG_B), eq(t.phone, '01700000001')) })
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a!.id).not.toBe(b!.id)
  })

  it('duplicate phone within same org rejected', async () => {
    await expect(
      db.insert(supplier).values(makeSupplier('dup', ORG_A, '01700000001'))
    ).rejects.toThrow()
  })

  it('status filter applies within org only', async () => {
    const repo = createSupplierRepository(db as any, ORG_A)
    const active = await repo.findMany('ACTIVE')
    expect(active).toHaveLength(2)
    for (const r of active) expect(r.organizationId).toBe(ORG_A)
  })
})

// ─── Supplier payment isolation ───────────────────────────────────────────────

describe('Supplier payment isolation', () => {
  beforeEach(async () => {
    await db.insert(supplier).values([
      makeSupplier('sup-a', ORG_A, '01700000001'),
      makeSupplier('sup-b', ORG_B, '01700000002'),
    ])
    await db.insert(supplierPayment).values([
      makeSupplierPayment('pay-a1', ORG_A, 'sup-a', 5000),
      makeSupplierPayment('pay-a2', ORG_A, 'sup-a', 3000),
      makeSupplierPayment('pay-b1', ORG_B, 'sup-b', 7000),
    ])
  })

  it('findPayments returns only org A payments for org A supplier', async () => {
    const repo = createSupplierRepository(db as any, ORG_A)
    const rows = await repo.findPayments('sup-a')
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(r.organizationId).toBe(ORG_A)
  })

  it('findPayments for org B supplier returns only org B payments', async () => {
    const repo = createSupplierRepository(db as any, ORG_B)
    const rows = await repo.findPayments('sup-b')
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('org A repo findPayments on org B supplier ID returns nothing', async () => {
    const repo = createSupplierRepository(db as any, ORG_A)
    const rows = await repo.findPayments('sup-b')
    expect(rows).toHaveLength(0)
  })

  it('getTotalPaid scoped to org — org A cannot aggregate org B payments', async () => {
    const repoA = createSupplierRepository(db as any, ORG_A)
    const repoB = createSupplierRepository(db as any, ORG_B)
    const totalA = await repoA.getTotalPaid('sup-a')
    const totalB = await repoB.getTotalPaid('sup-b')
    expect(totalA).toBe(8000)
    expect(totalB).toBe(7000)
  })

  it('org A getTotalPaid on org B supplier ID returns 0', async () => {
    const repo = createSupplierRepository(db as any, ORG_A)
    const total = await repo.getTotalPaid('sup-b')
    expect(total).toBe(0)
  })

  it('createPayment tagged with org A not visible via org B repo', async () => {
    const repoA = createSupplierRepository(db as any, ORG_A)
    const repoB = createSupplierRepository(db as any, ORG_B)

    await repoA.createPayment({ supplierId: 'sup-a', amount: 1000, paymentMethod: 'CASH' })

    const bRows = await repoB.findPayments('sup-b')
    expect(bRows).toHaveLength(1) // only pre-existing org B payment
  })
})

// ─── Purchase order isolation ────────────────────────────────────────────────

describe('Purchase order isolation', () => {
  beforeEach(async () => {
    await db.insert(supplier).values([
      makeSupplier('sup-a', ORG_A, '01700000001'),
      makeSupplier('sup-b', ORG_B, '01700000002'),
    ])
    await db.insert(purchaseOrder).values([
      makePurchaseOrder('po-a1', ORG_A, 'sup-a', LOC_A, 'PO-2024-001', 10000),
      makePurchaseOrder('po-a2', ORG_A, 'sup-a', LOC_A, 'PO-2024-002', 5000),
      makePurchaseOrder('po-b1', ORG_B, 'sup-b', LOC_B, 'PO-2024-001', 8000), // same number, different org
    ])
  })

  it('repo A sees only org A purchase orders', async () => {
    const repo = createPurchasesRepository(db as any, ORG_A)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(r.organizationId).toBe(ORG_A)
  })

  it('repo B sees only org B purchase orders', async () => {
    const repo = createPurchasesRepository(db as any, ORG_B)
    const rows = await repo.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('findById from org A cannot see org B order', async () => {
    const repo = createPurchasesRepository(db as any, ORG_A)
    const found = await repo.findById('po-b1')
    expect(found).toBeNull()
  })

  it('findByNumber from org A returns org A order', async () => {
    const repo = createPurchasesRepository(db as any, ORG_A)
    const found = await repo.findByNumber('PO-2024-001')
    expect(found?.organizationId).toBe(ORG_A)
  })

  it('same purchase number allowed in two different orgs', async () => {
    const a = await db.query.purchaseOrder.findFirst({ where: (t, { and, eq }) => and(eq(t.organizationId, ORG_A), eq(t.purchaseNumber, 'PO-2024-001')) })
    const b = await db.query.purchaseOrder.findFirst({ where: (t, { and, eq }) => and(eq(t.organizationId, ORG_B), eq(t.purchaseNumber, 'PO-2024-001')) })
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a!.id).not.toBe(b!.id)
  })

  it('duplicate purchase number within same org rejected', async () => {
    await expect(
      db.insert(purchaseOrder).values(makePurchaseOrder('dup', ORG_A, 'sup-a', LOC_A, 'PO-2024-001'))
    ).rejects.toThrow()
  })

  it('countByOrg counts only own orders', async () => {
    const repoA = createPurchasesRepository(db as any, ORG_A)
    const repoB = createPurchasesRepository(db as any, ORG_B)
    expect(await repoA.countByOrg()).toBe(2)
    expect(await repoB.countByOrg()).toBe(1)
  })

  it('status filter applies within org only', async () => {
    const repo = createPurchasesRepository(db as any, ORG_A)
    const drafts = await repo.findMany('DRAFT')
    expect(drafts).toHaveLength(2)
    for (const r of drafts) expect(r.organizationId).toBe(ORG_A)
  })

  it('getTotalPurchased scoped to org — org A cannot aggregate org B totals', async () => {
    const repoA = createPurchasesRepository(db as any, ORG_A)
    const repoB = createPurchasesRepository(db as any, ORG_B)

    // DRAFT orders don't count toward total — promote one to RECEIVED
    await db.update(purchaseOrder)
      .set({ status: 'RECEIVED' })
      .where((await import('drizzle-orm')).eq(purchaseOrder.id, 'po-a1'))

    const totalA = await repoA.getTotalPurchased('sup-a')
    const totalB = await repoB.getTotalPurchased('sup-b')
    expect(totalA).toBe(10000)
    expect(totalB).toBe(0) // po-b1 still DRAFT
  })

  it('org A getTotalPurchased on org B supplier ID returns 0', async () => {
    const repo = createPurchasesRepository(db as any, ORG_A)
    const total = await repo.getTotalPurchased('sup-b')
    expect(total).toBe(0)
  })

  it('create scoped to org A — org B repo cannot see it', async () => {
    const repoA = createPurchasesRepository(db as any, ORG_A)
    const repoB = createPurchasesRepository(db as any, ORG_B)

    await repoA.create({
      supplierId: 'sup-a',
      purchaseNumber: 'PO-2024-NEW',
      status: 'DRAFT',
      receivingLocationId: LOC_A,
      subtotal: 0,
      tax: 0,
      discount: 0,
      grandTotal: 0,
    })

    const bRows = await repoB.findMany()
    expect(bRows).toHaveLength(1) // only pre-existing org B order
  })

  it('update from org A does not affect org B order', async () => {
    const repoA = createPurchasesRepository(db as any, ORG_A)
    const repoB = createPurchasesRepository(db as any, ORG_B)

    await repoA.update('po-b1', { status: 'CANCELLED' })

    const bOrder = await repoB.findById('po-b1')
    expect(bOrder?.status).toBe('DRAFT') // org B still DRAFT — cross-tenant update was no-op
  })
})
