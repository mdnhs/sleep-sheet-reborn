import { eq, and, desc, like, or, sql } from 'drizzle-orm'
import {
  customer, customerAddress, customerWalletTransaction, customerLoyaltyTransaction,
  order, posSale,
} from '@repo/database/schema'
import type {
  Database, NewCustomer, Customer,
  NewCustomerAddress, CustomerAddress,
  NewCustomerWalletTransaction, NewCustomerLoyaltyTransaction,
} from '@repo/database'
import { generateId } from '../utils/id'

export function createCustomersRepository(db: Database, organizationId: string) {
  const scope = eq(customer.organizationId, organizationId)
  const addrScope = eq(customerAddress.organizationId, organizationId)
  const walletScope = eq(customerWalletTransaction.organizationId, organizationId)
  const loyaltyScope = eq(customerLoyaltyTransaction.organizationId, organizationId)

  return {
    // ── Customers ───────────────────────────────────────────────────────────────

    findMany(opts?: { status?: Customer['status']; groupId?: string; search?: string }) {
      const conditions = [scope] as ReturnType<typeof eq>[]
      if (opts?.status) conditions.push(eq(customer.status, opts.status))
      if (opts?.groupId) conditions.push(eq(customer.groupId, opts.groupId))
      if (opts?.search) {
        const q = `%${opts.search}%`
        conditions.push(or(like(customer.name, q), like(customer.phone, q), like(customer.email, q))!)
      }
      return db.select().from(customer).where(and(...conditions)).orderBy(desc(customer.createdAt))
    },

    findById(id: string) {
      return db.select().from(customer)
        .where(and(scope, eq(customer.id, id)))
        .then(r => r[0] ?? null)
    },

    findByPhone(phone: string) {
      return db.select().from(customer)
        .where(and(scope, eq(customer.phone, phone)))
        .then(r => r[0] ?? null)
    },

    async create(data: {
      name: string; phone: string; email?: string | null; groupId?: string | null
      type?: Customer['type']; dateOfBirth?: Date | null; notes?: string | null
    }) {
      const now = new Date()
      const row: NewCustomer = {
        id: generateId(), organizationId,
        groupId: data.groupId ?? null, name: data.name, phone: data.phone,
        email: data.email ?? null, dateOfBirth: data.dateOfBirth ?? null,
        type: data.type ?? 'REGISTERED', status: 'ACTIVE', notes: data.notes ?? null,
        walletBalance: 0, loyaltyPoints: 0, createdAt: now, updatedAt: now,
      }
      await db.insert(customer).values(row)
      return row
    },

    async update(id: string, data: Partial<Pick<Customer,
      'name' | 'phone' | 'email' | 'groupId' | 'type' | 'status' | 'dateOfBirth' | 'notes'>>) {
      await db.update(customer)
        .set({ ...data, updatedAt: new Date() })
        .where(and(scope, eq(customer.id, id)))
      return this.findById(id)
    },

    /** Apply a signed delta to the cached wallet balance. Returns the new balance. */
    async adjustWalletBalance(id: string, delta: number): Promise<number> {
      await db.update(customer)
        .set({ walletBalance: sql`${customer.walletBalance} + ${delta}`, updatedAt: new Date() })
        .where(and(scope, eq(customer.id, id)))
      const c = await this.findById(id)
      return c?.walletBalance ?? 0
    },

    /** Apply a signed delta to the cached loyalty points. Returns the new total. */
    async adjustLoyaltyPoints(id: string, delta: number): Promise<number> {
      await db.update(customer)
        .set({ loyaltyPoints: sql`${customer.loyaltyPoints} + ${delta}`, updatedAt: new Date() })
        .where(and(scope, eq(customer.id, id)))
      const c = await this.findById(id)
      return c?.loyaltyPoints ?? 0
    },

    async countByOrg(): Promise<number> {
      const r = await db.select({ n: sql<number>`COUNT(*)` }).from(customer).where(scope)
      return r[0]?.n ?? 0
    },

    // ── Addresses ───────────────────────────────────────────────────────────────

    findAddresses(customerId: string) {
      return db.select().from(customerAddress)
        .where(and(addrScope, eq(customerAddress.customerId, customerId)))
        .orderBy(desc(customerAddress.isDefault), desc(customerAddress.createdAt))
    },

    async createAddress(data: Omit<NewCustomerAddress, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewCustomerAddress = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(customerAddress).values(row)
      return row
    },

    async updateAddress(id: string, data: Partial<Pick<CustomerAddress,
      'type' | 'name' | 'phone' | 'addressLine' | 'area' | 'city' | 'postalCode' | 'isDefault'>>) {
      await db.update(customerAddress)
        .set({ ...data, updatedAt: new Date() })
        .where(and(addrScope, eq(customerAddress.id, id)))
      return db.select().from(customerAddress)
        .where(and(addrScope, eq(customerAddress.id, id)))
        .then(r => r[0] ?? null)
    },

    // ── Wallet transactions (immutable) ───────────────────────────────────────────

    findWalletTransactions(customerId: string) {
      return db.select().from(customerWalletTransaction)
        .where(and(walletScope, eq(customerWalletTransaction.customerId, customerId)))
        .orderBy(desc(customerWalletTransaction.createdAt))
    },

    async createWalletTransaction(data: Omit<NewCustomerWalletTransaction, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewCustomerWalletTransaction = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(customerWalletTransaction).values(row)
      return row
    },

    // ── Loyalty transactions (immutable) ─────────────────────────────────────────

    findLoyaltyTransactions(customerId: string) {
      return db.select().from(customerLoyaltyTransaction)
        .where(and(loyaltyScope, eq(customerLoyaltyTransaction.customerId, customerId)))
        .orderBy(desc(customerLoyaltyTransaction.createdAt))
    },

    async createLoyaltyTransaction(data: Omit<NewCustomerLoyaltyTransaction, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewCustomerLoyaltyTransaction = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(customerLoyaltyTransaction).values(row)
      return row
    },

    // ── Purchase history (aggregated across orders + POS sales) ───────────────────

    async getPurchaseStats(customerId: string) {
      const orderAgg = await db
        .select({
          count: sql<number>`COUNT(*)`,
          total: sql<number>`COALESCE(SUM(${order.grandTotal}), 0)`,
          last: sql<number | null>`MAX(${order.createdAt})`,
        })
        .from(order)
        .where(and(eq(order.organizationId, organizationId), eq(order.customerId, customerId)))

      const posAgg = await db
        .select({
          count: sql<number>`COUNT(*)`,
          total: sql<number>`COALESCE(SUM(${posSale.grandTotal}), 0)`,
          last: sql<number | null>`MAX(${posSale.createdAt})`,
        })
        .from(posSale)
        .where(and(
          eq(posSale.organizationId, organizationId),
          eq(posSale.customerId, customerId),
          eq(posSale.status, 'COMPLETED'),
        ))

      const o = orderAgg[0] ?? { count: 0, total: 0, last: null }
      const p = posAgg[0] ?? { count: 0, total: 0, last: null }
      const totalOrders = (o.count ?? 0) + (p.count ?? 0)
      const totalSpent = (o.total ?? 0) + (p.total ?? 0)
      const lastTs = Math.max(Number(o.last ?? 0), Number(p.last ?? 0))
      return {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders ? Math.round(totalSpent / totalOrders) : 0,
        lastPurchaseAt: lastTs > 0 ? new Date(lastTs * 1000) : null,
      }
    },

    listOrders(customerId: string) {
      return db.select().from(order)
        .where(and(eq(order.organizationId, organizationId), eq(order.customerId, customerId)))
        .orderBy(desc(order.createdAt))
    },

    listPosSales(customerId: string) {
      return db.select().from(posSale)
        .where(and(eq(posSale.organizationId, organizationId), eq(posSale.customerId, customerId)))
        .orderBy(desc(posSale.createdAt))
    },
  }
}

export type CustomersRepository = ReturnType<typeof createCustomersRepository>
