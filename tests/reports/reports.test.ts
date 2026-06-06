import { describe, it, expect, beforeEach } from 'vitest'
import { createReportsService } from '../../apps/worker/services/v1/reports.service'
import { createTestDb, seed, type TestCtx } from './setup'

let ctx: TestCtx
let s: ReturnType<typeof seed>
const ORG_A = 'org-a'
const ORG_B = 'org-b'
const svc = (org: string) => createReportsService(ctx.db as any, org)

let locA: string, locA2: string, varA: string, supA: string

beforeEach(() => {
  ctx = createTestDb()
  s = seed(ctx.sqlite)
  s.org(ORG_A); s.org(ORG_B)
  locA = s.location(ORG_A, 'Main Outlet')
  locA2 = s.location(ORG_A, 'Second Outlet')
  varA = s.variant(ORG_A, 'SKU-A', 100, 250)
  supA = s.supplier(ORG_A, 'Acme')
})

describe('Sales reports', () => {
  it('summary combines orders and completed POS, excludes cancelled/draft', () => {
    s.order(ORG_A, { grandTotal: 1000, locationId: locA })
    s.order(ORG_A, { grandTotal: 500, locationId: locA, status: 'CANCELLED' }) // excluded
    s.posSale(ORG_A, { grandTotal: 300, locationId: locA })
    s.posSale(ORG_A, { grandTotal: 999, locationId: locA, status: 'DRAFT' }) // excluded
    return svc(ORG_A).salesSummary().then(r => {
      expect(r.orderRevenue).toBe(1000)
      expect(r.posRevenue).toBe(300)
      expect(r.totalRevenue).toBe(1300)
      expect(r.totalOrders).toBe(2)
      expect(r.averageOrderValue).toBe(650)
    })
  })

  it('by-channel groups orders by source and adds POS', async () => {
    s.order(ORG_A, { grandTotal: 1000, locationId: locA, source: 'WEBSITE' })
    s.order(ORG_A, { grandTotal: 400, locationId: locA, source: 'FUNNEL' })
    s.posSale(ORG_A, { grandTotal: 600, locationId: locA })
    const rows = await svc(ORG_A).salesByChannel()
    const web = rows.find(r => r.channel === 'WEBSITE')!
    const pos = rows.find(r => r.channel === 'POS')!
    expect(web.revenue).toBe(1000)
    expect(pos.revenue).toBe(600)
  })

  it('top-products merges order + POS units by variant', async () => {
    const o = s.order(ORG_A, { grandTotal: 500, locationId: locA })
    s.orderItem(o, varA, 3, 750)
    const p = s.posSale(ORG_A, { grandTotal: 500, locationId: locA })
    s.posItem(p, varA, 2, 500)
    const top = await svc(ORG_A).topProducts()
    expect(top[0].sku).toBe('SKU-A')
    expect(top[0].units).toBe(5)
    expect(top[0].revenue).toBe(1250)
  })

  it('outlet performance groups revenue by location', async () => {
    s.order(ORG_A, { grandTotal: 1000, locationId: locA })
    s.posSale(ORG_A, { grandTotal: 500, locationId: locA })
    s.order(ORG_A, { grandTotal: 200, locationId: locA2 })
    const rows = await svc(ORG_A).outletPerformance()
    expect(rows[0].locationName).toBe('Main Outlet')
    expect(rows[0].revenue).toBe(1500)
    expect(rows.find(r => r.locationName === 'Second Outlet')!.revenue).toBe(200)
  })

  it('is org-scoped — other tenant sales excluded', async () => {
    s.order(ORG_B, { grandTotal: 9999, locationId: s.location(ORG_B, 'B') })
    const r = await svc(ORG_A).salesSummary()
    expect(r.totalRevenue).toBe(0)
  })
})

describe('Inventory reports', () => {
  it('valuation computes cost and retail value', async () => {
    s.inventory(ORG_A, varA, locA, 10) // cost 100, sell 250
    const v = await svc(ORG_A).inventoryValuation()
    expect(v.totalUnits).toBe(10)
    expect(v.costValue).toBe(1000)
    expect(v.retailValue).toBe(2500)
    expect(v.potentialMargin).toBe(1500)
  })

  it('low-stock lists items at or below threshold', async () => {
    s.inventory(ORG_A, varA, locA, 3)
    const varB = s.variant(ORG_A, 'SKU-B', 50, 100)
    s.inventory(ORG_A, varB, locA, 20)
    const rows = await svc(ORG_A).lowStock(5)
    expect(rows).toHaveLength(1)
    expect(rows[0].sku).toBe('SKU-A')
  })

  it('movement summary groups by type with net quantity', async () => {
    s.movement(ORG_A, varA, locA, 'PURCHASE', 50)
    s.movement(ORG_A, varA, locA, 'POS_SALE', -5)
    s.movement(ORG_A, varA, locA, 'POS_SALE', -3)
    const rows = await svc(ORG_A).movementSummary()
    const sale = rows.find(r => r.movementType === 'POS_SALE')!
    expect(sale.count).toBe(2)
    expect(sale.netQuantity).toBe(-8)
  })
})

describe('Purchase reports', () => {
  it('summary groups by status and top suppliers', async () => {
    s.purchase(ORG_A, supA, 'RECEIVED', 5000)
    s.purchase(ORG_A, supA, 'DRAFT', 2000)
    const r = await svc(ORG_A).purchaseSummary()
    expect(r.totalSpend).toBe(7000)
    expect(r.topSuppliers[0].supplierName).toBe('Acme')
    expect(r.topSuppliers[0].total).toBe(7000)
  })
})
