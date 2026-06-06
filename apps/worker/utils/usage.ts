import { eq, and, gte, sql } from 'drizzle-orm'
import { product, location, member, order } from '@repo/database/schema'
import type { Database } from '@repo/database'

async function count(db: Database, table: any, where: any): Promise<number> {
  const r = await db.select({ n: sql<number>`COUNT(*)` }).from(table).where(where)
  return r[0]?.n ?? 0
}

function startOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/** Live per-org usage counters. Caching is deferred to Phase 14. */
export async function getUsage(db: Database, organizationId: string) {
  const [products, outlets, warehouses, users, ordersThisMonth] = await Promise.all([
    count(db, product, eq(product.organizationId, organizationId)),
    count(db, location, and(eq(location.organizationId, organizationId), eq(location.type, 'OUTLET'))),
    count(db, location, and(eq(location.organizationId, organizationId), eq(location.type, 'WAREHOUSE'))),
    count(db, member, eq(member.organizationId, organizationId)),
    count(db, order, and(eq(order.organizationId, organizationId), gte(order.createdAt, startOfMonth() as any))),
  ])
  return { products, outlets, warehouses, users, ordersThisMonth }
}

export type UsageKey = 'products' | 'outlets' | 'warehouses' | 'users' | 'ordersThisMonth'
