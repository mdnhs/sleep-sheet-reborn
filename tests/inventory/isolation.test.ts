import { describe, it, expect, beforeEach } from 'vitest'
import { organization, product, productVariant, location, inventory, inventoryMovement, transfer, transferItem } from '@repo/database/src/schema'
import { createInventoryRepository } from '../../apps/worker/repositories/inventory.repository'
import {
  createTestDb,
  makeOrg, makeProduct, makeVariant, makeLocation,
  makeStock, makeMovement, makeTransfer, makeTransferItem,
  type TestDb,
} from './setup'

let db: TestDb
const ORG_A = 'org-a'
const ORG_B = 'org-b'

// Shared fixture IDs
const LOC_A1 = 'loc-a1'
const LOC_A2 = 'loc-a2'
const LOC_B1 = 'loc-b1'
const VAR_A = 'var-a'
const VAR_B = 'var-b'

beforeEach(async () => {
  db = createTestDb()

  await db.insert(organization).values([makeOrg(ORG_A, 'org-a'), makeOrg(ORG_B, 'org-b')])

  await db.insert(product).values([
    makeProduct('prod-a', ORG_A, 'rice'),
    makeProduct('prod-b', ORG_B, 'rice'),
  ])

  await db.insert(productVariant).values([
    makeVariant(VAR_A, ORG_A, 'prod-a', 'SKU-A'),
    makeVariant(VAR_B, ORG_B, 'prod-b', 'SKU-B'),
  ])

  await db.insert(location).values([
    makeLocation(LOC_A1, ORG_A, 'WH-A1'),
    makeLocation(LOC_A2, ORG_A, 'WH-A2'),
    makeLocation(LOC_B1, ORG_B, 'WH-B1'),
  ])
})

// ─── Inventory stock isolation ───────────────────────────────────────────────

describe('Inventory stock isolation', () => {
  beforeEach(async () => {
    await db.insert(inventory).values([
      makeStock('inv-a1', ORG_A, VAR_A, LOC_A1, 100),
      makeStock('inv-a2', ORG_A, VAR_A, LOC_A2, 50),
      makeStock('inv-b1', ORG_B, VAR_B, LOC_B1, 200),
    ])
  })

  it('repo A finds stock only within org A', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const rows = await repo.findByVariant(VAR_A)
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(r.organizationId).toBe(ORG_A)
  })

  it('repo B finds stock only within org B', async () => {
    const repo = createInventoryRepository(db as any, ORG_B)
    const rows = await repo.findByVariant(VAR_B)
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('repo A cannot read org B stock by location', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const rows = await repo.findByLocation(LOC_B1)
    expect(rows).toHaveLength(0)
  })

  it('repo A cannot find org B stock by variant+location', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const row = await repo.findByVariantAndLocation(VAR_B, LOC_B1)
    expect(row).toBeNull()
  })

  it('upsertStock respects org scope — org A write does not affect org B row', async () => {
    const repoA = createInventoryRepository(db as any, ORG_A)
    const repoB = createInventoryRepository(db as any, ORG_B)

    await repoA.upsertStock(VAR_A, LOC_A1, 999)

    const bStock = await repoB.findByVariant(VAR_B)
    expect(bStock[0].quantity).toBe(200) // unchanged
  })
})

// ─── Inventory movement isolation ───────────────────────────────────────────

describe('Inventory movement isolation', () => {
  beforeEach(async () => {
    await db.insert(inventoryMovement).values([
      makeMovement('mov-a1', ORG_A, VAR_A, LOC_A1, 'ADJUSTMENT', 10),
      makeMovement('mov-a2', ORG_A, VAR_A, LOC_A1, 'ADJUSTMENT', -5),
      makeMovement('mov-b1', ORG_B, VAR_B, LOC_B1, 'ADJUSTMENT', 20),
    ])
  })

  it('repo A sees only org A movements', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const rows = await repo.findMovements()
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(r.organizationId).toBe(ORG_A)
  })

  it('repo B sees only org B movements', async () => {
    const repo = createInventoryRepository(db as any, ORG_B)
    const rows = await repo.findMovements()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('repo A movements filtered by variant returns only org A rows', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const rows = await repo.findMovements(VAR_B)
    expect(rows).toHaveLength(0)
  })

  it('createMovement tags with org A — org B repo cannot read it', async () => {
    const repoA = createInventoryRepository(db as any, ORG_A)
    const repoB = createInventoryRepository(db as any, ORG_B)

    await repoA.createMovement({ variantId: VAR_A, locationId: LOC_A1, movementType: 'ADJUSTMENT', quantity: 5 })

    const bMov = await repoB.findMovements()
    expect(bMov).toHaveLength(1) // only the pre-existing org B row
  })
})

// ─── Transfer isolation ──────────────────────────────────────────────────────

describe('Transfer isolation', () => {
  beforeEach(async () => {
    await db.insert(transfer).values([
      makeTransfer('tr-a1', ORG_A, LOC_A1, LOC_A2, 'DRAFT'),
      makeTransfer('tr-a2', ORG_A, LOC_A1, LOC_A2, 'APPROVED'),
      makeTransfer('tr-b1', ORG_B, LOC_B1, LOC_B1, 'DRAFT'),
    ])
    await db.insert(transferItem).values([
      makeTransferItem('ti-a1', 'tr-a1', VAR_A, 10),
      makeTransferItem('ti-b1', 'tr-b1', VAR_B, 5),
    ])
  })

  it('repo A lists only org A transfers', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const rows = await repo.findTransfers()
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(r.organizationId).toBe(ORG_A)
  })

  it('repo B lists only org B transfers', async () => {
    const repo = createInventoryRepository(db as any, ORG_B)
    const rows = await repo.findTransfers()
    expect(rows).toHaveLength(1)
    expect(rows[0].organizationId).toBe(ORG_B)
  })

  it('repo A cannot find org B transfer by ID', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const row = await repo.findTransferById('tr-b1')
    expect(row).toBeNull()
  })

  it('repo A status filter applies within org only', async () => {
    const repo = createInventoryRepository(db as any, ORG_A)
    const approved = await repo.findTransfers('APPROVED')
    expect(approved).toHaveLength(1)
    expect(approved[0].id).toBe('tr-a2')
  })

  it('createTransfer scopes to org A — org B repo cannot see it', async () => {
    const repoA = createInventoryRepository(db as any, ORG_A)
    const repoB = createInventoryRepository(db as any, ORG_B)

    await repoA.createTransfer({ fromLocationId: LOC_A1, toLocationId: LOC_A2, status: 'DRAFT' })

    const bTransfers = await repoB.findTransfers()
    expect(bTransfers).toHaveLength(1) // only the pre-existing org B transfer
  })

  it('updateTransferStatus from org A does not affect org B transfer', async () => {
    const repoA = createInventoryRepository(db as any, ORG_A)
    const repoB = createInventoryRepository(db as any, ORG_B)

    await repoA.updateTransferStatus('tr-b1', 'CANCELLED')

    const bTransfer = await repoB.findTransferById('tr-b1')
    expect(bTransfer?.status).toBe('DRAFT') // org B still DRAFT — org A update was no-op across tenant
  })
})
