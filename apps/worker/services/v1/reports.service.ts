import { eq, and, gte, lte, ne, sql, desc, type SQL } from 'drizzle-orm'
import {
  order, orderItem, posSale, posSaleItem, inventory, inventoryMovement,
  productVariant, location, purchaseOrder, supplier,
} from '@repo/database/schema'
import type { Database } from '@repo/database'

type Granularity = 'day' | 'month' | 'year'
const BUCKET: Record<Granularity, string> = { day: '%Y-%m-%d', month: '%Y-%m', year: '%Y' }

/** Read-only reporting aggregations. Org-scoped; never mutates. */
export function createReportsService(db: Database, organizationId: string) {
  const orderScope = eq(order.organizationId, organizationId)
  const posScope = eq(posSale.organizationId, organizationId)

  // Date-range condition helpers (createdAt stored as unix seconds)
  function range(col: any, from?: string, to?: string): SQL[] {
    const c: SQL[] = []
    if (from) c.push(gte(col, new Date(from)))
    if (to) c.push(lte(col, new Date(to)))
    return c
  }

  return {
    // ── Sales ───────────────────────────────────────────────────────────────────
    async salesSummary(from?: string, to?: string) {
      const [ord] = await db.select({
        revenue: sql<number>`COALESCE(SUM(${order.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(order).where(and(orderScope, ne(order.status, 'CANCELLED'), ...range(order.createdAt, from, to)))

      const [pos] = await db.select({
        revenue: sql<number>`COALESCE(SUM(${posSale.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(posSale).where(and(posScope, eq(posSale.status, 'COMPLETED'), ...range(posSale.createdAt, from, to)))

      const orderRevenue = ord?.revenue ?? 0
      const posRevenue = pos?.revenue ?? 0
      const orderCount = ord?.count ?? 0
      const posCount = pos?.count ?? 0
      const totalRevenue = orderRevenue + posRevenue
      const totalOrders = orderCount + posCount
      return {
        totalRevenue, totalOrders,
        orderRevenue, orderCount, posRevenue, posCount,
        averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
      }
    },

    async salesTimeSeries(granularity: Granularity, from?: string, to?: string) {
      const fmt = BUCKET[granularity]
      const ordRows = await db.select({
        bucket: sql<string>`strftime(${fmt}, ${order.createdAt}, 'unixepoch')`,
        revenue: sql<number>`COALESCE(SUM(${order.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(order).where(and(orderScope, ne(order.status, 'CANCELLED'), ...range(order.createdAt, from, to)))
        .groupBy(sql`1`)

      const posRows = await db.select({
        bucket: sql<string>`strftime(${fmt}, ${posSale.createdAt}, 'unixepoch')`,
        revenue: sql<number>`COALESCE(SUM(${posSale.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(posSale).where(and(posScope, eq(posSale.status, 'COMPLETED'), ...range(posSale.createdAt, from, to)))
        .groupBy(sql`1`)

      const byBucket = new Map<string, { period: string; revenue: number; orders: number }>()
      for (const r of [...ordRows, ...posRows]) {
        if (!r.bucket) continue
        const e = byBucket.get(r.bucket) ?? { period: r.bucket, revenue: 0, orders: 0 }
        e.revenue += r.revenue ?? 0
        e.orders += r.count ?? 0
        byBucket.set(r.bucket, e)
      }
      return [...byBucket.values()].sort((a, b) => a.period.localeCompare(b.period))
    },

    async salesByChannel(from?: string, to?: string) {
      const channels = await db.select({
        channel: order.source,
        revenue: sql<number>`COALESCE(SUM(${order.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(order).where(and(orderScope, ne(order.status, 'CANCELLED'), ...range(order.createdAt, from, to)))
        .groupBy(order.source)

      const [pos] = await db.select({
        revenue: sql<number>`COALESCE(SUM(${posSale.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(posSale).where(and(posScope, eq(posSale.status, 'COMPLETED'), ...range(posSale.createdAt, from, to)))

      const rows = channels.map(c => ({ channel: c.channel, revenue: c.revenue ?? 0, orders: c.count ?? 0 }))
      if ((pos?.count ?? 0) > 0) rows.push({ channel: 'POS', revenue: pos.revenue ?? 0, orders: pos.count ?? 0 })
      return rows.sort((a, b) => b.revenue - a.revenue)
    },

    async topProducts(limit = 20, from?: string, to?: string) {
      const ordRows = await db.select({
        variantId: orderItem.variantId,
        qty: sql<number>`COALESCE(SUM(${orderItem.quantity}),0)`,
        revenue: sql<number>`COALESCE(SUM(${orderItem.lineTotal}),0)`,
      }).from(orderItem)
        .innerJoin(order, eq(orderItem.orderId, order.id))
        .where(and(orderScope, ne(order.status, 'CANCELLED'), ...range(order.createdAt, from, to)))
        .groupBy(orderItem.variantId)

      const posRows = await db.select({
        variantId: posSaleItem.variantId,
        qty: sql<number>`COALESCE(SUM(${posSaleItem.quantity}),0)`,
        revenue: sql<number>`COALESCE(SUM(${posSaleItem.lineTotal}),0)`,
      }).from(posSaleItem)
        .innerJoin(posSale, eq(posSaleItem.saleId, posSale.id))
        .where(and(posScope, eq(posSale.status, 'COMPLETED'), ...range(posSale.createdAt, from, to)))
        .groupBy(posSaleItem.variantId)

      const merged = new Map<string, { variantId: string; units: number; revenue: number }>()
      for (const r of [...ordRows, ...posRows]) {
        const e = merged.get(r.variantId) ?? { variantId: r.variantId, units: 0, revenue: 0 }
        e.units += r.qty ?? 0
        e.revenue += r.revenue ?? 0
        merged.set(r.variantId, e)
      }
      const top = [...merged.values()].sort((a, b) => b.units - a.units).slice(0, limit)
      const variants = await db.select({ id: productVariant.id, sku: productVariant.sku, name: productVariant.name })
        .from(productVariant).where(eq(productVariant.organizationId, organizationId))
      const vmap = new Map(variants.map(v => [v.id, v]))
      return top.map(t => ({ ...t, sku: vmap.get(t.variantId)?.sku ?? '—', name: vmap.get(t.variantId)?.name ?? 'Unknown' }))
    },

    // ── Inventory ─────────────────────────────────────────────────────────────────
    async inventoryValuation() {
      const [row] = await db.select({
        units: sql<number>`COALESCE(SUM(${inventory.quantity}),0)`,
        costValue: sql<number>`COALESCE(SUM(${inventory.quantity} * ${productVariant.costPrice}),0)`,
        retailValue: sql<number>`COALESCE(SUM(${inventory.quantity} * ${productVariant.sellingPrice}),0)`,
      }).from(inventory)
        .innerJoin(productVariant, eq(inventory.variantId, productVariant.id))
        .where(eq(inventory.organizationId, organizationId))
      return {
        totalUnits: row?.units ?? 0,
        costValue: row?.costValue ?? 0,
        retailValue: row?.retailValue ?? 0,
        potentialMargin: (row?.retailValue ?? 0) - (row?.costValue ?? 0),
      }
    },

    async lowStock(threshold = 5) {
      return db.select({
        variantId: inventory.variantId, locationId: inventory.locationId, quantity: inventory.quantity,
        sku: productVariant.sku, name: productVariant.name, locationName: location.name,
      }).from(inventory)
        .innerJoin(productVariant, eq(inventory.variantId, productVariant.id))
        .innerJoin(location, eq(inventory.locationId, location.id))
        .where(and(eq(inventory.organizationId, organizationId), lte(inventory.quantity, threshold)))
        .orderBy(inventory.quantity)
    },

    async movementSummary(from?: string, to?: string) {
      const rows = await db.select({
        movementType: inventoryMovement.movementType,
        count: sql<number>`COUNT(*)`,
        netQuantity: sql<number>`COALESCE(SUM(${inventoryMovement.quantity}),0)`,
      }).from(inventoryMovement)
        .where(and(eq(inventoryMovement.organizationId, organizationId), ...range(inventoryMovement.createdAt, from, to)))
        .groupBy(inventoryMovement.movementType)
      return rows.map(r => ({ movementType: r.movementType, count: r.count ?? 0, netQuantity: r.netQuantity ?? 0 }))
    },

    // ── Outlet performance ──────────────────────────────────────────────────────────
    async outletPerformance(from?: string, to?: string) {
      const ordRows = await db.select({
        locationId: order.fulfillmentLocationId,
        revenue: sql<number>`COALESCE(SUM(${order.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(order).where(and(orderScope, ne(order.status, 'CANCELLED'), ...range(order.createdAt, from, to)))
        .groupBy(order.fulfillmentLocationId)

      const posRows = await db.select({
        locationId: posSale.locationId,
        revenue: sql<number>`COALESCE(SUM(${posSale.grandTotal}),0)`,
        count: sql<number>`COUNT(*)`,
      }).from(posSale).where(and(posScope, eq(posSale.status, 'COMPLETED'), ...range(posSale.createdAt, from, to)))
        .groupBy(posSale.locationId)

      const byLoc = new Map<string, { locationId: string; revenue: number; orders: number }>()
      for (const r of [...ordRows, ...posRows]) {
        if (!r.locationId) continue
        const e = byLoc.get(r.locationId) ?? { locationId: r.locationId, revenue: 0, orders: 0 }
        e.revenue += r.revenue ?? 0
        e.orders += r.count ?? 0
        byLoc.set(r.locationId, e)
      }
      const locations = await db.select({ id: location.id, name: location.name })
        .from(location).where(eq(location.organizationId, organizationId))
      const lmap = new Map(locations.map(l => [l.id, l.name]))
      return [...byLoc.values()]
        .map(r => ({ ...r, locationName: lmap.get(r.locationId) ?? 'Unknown' }))
        .sort((a, b) => b.revenue - a.revenue)
    },

    // ── Purchases ─────────────────────────────────────────────────────────────────
    async purchaseSummary(from?: string, to?: string) {
      const byStatus = await db.select({
        status: purchaseOrder.status,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`COALESCE(SUM(${purchaseOrder.grandTotal}),0)`,
      }).from(purchaseOrder)
        .where(and(eq(purchaseOrder.organizationId, organizationId), ...range(purchaseOrder.createdAt, from, to)))
        .groupBy(purchaseOrder.status)

      const bySupplier = await db.select({
        supplierId: purchaseOrder.supplierId,
        supplierName: supplier.name,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`COALESCE(SUM(${purchaseOrder.grandTotal}),0)`,
      }).from(purchaseOrder)
        .innerJoin(supplier, eq(purchaseOrder.supplierId, supplier.id))
        .where(and(eq(purchaseOrder.organizationId, organizationId), ...range(purchaseOrder.createdAt, from, to)))
        .groupBy(purchaseOrder.supplierId)
        .orderBy(desc(sql`3`))

      return {
        byStatus: byStatus.map(r => ({ status: r.status, count: r.count ?? 0, total: r.total ?? 0 })),
        topSuppliers: bySupplier.map(r => ({ supplierId: r.supplierId, supplierName: r.supplierName, count: r.count ?? 0, total: r.total ?? 0 })).slice(0, 10),
        totalSpend: byStatus.reduce((s, r) => s + (r.total ?? 0), 0),
      }
    },
  }
}

export type ReportsService = ReturnType<typeof createReportsService>
