import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'
import { subscription, subscriptionInvoice } from '@repo/database/schema'
import type { Database, NewSubscription, NewSubscriptionInvoice, Subscription, SubscriptionInvoice } from '@repo/database'
import { generateId } from '../utils/id'

export function createSubscriptionsRepository(db: Database, organizationId: string) {
  const subScope = eq(subscription.organizationId, organizationId)
  const invScope = eq(subscriptionInvoice.organizationId, organizationId)

  return {
    // ── Subscription (one per org) ──────────────────────────────────────────────

    findSubscription() {
      return db.select().from(subscription)
        .where(subScope)
        .then(r => r[0] ?? null)
    },

    async createSubscription(data: Omit<NewSubscription, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewSubscription = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(subscription).values(row)
      return row
    },

    async updateSubscription(data: Partial<Pick<Subscription, 'planId' | 'status' | 'trialEndsAt' | 'currentPeriodStart' | 'currentPeriodEnd' | 'graceEndsAt' | 'autoRenew'>>) {
      await db.update(subscription)
        .set({ ...data, updatedAt: new Date() })
        .where(subScope)
      return this.findSubscription()
    },

    // ── Invoices (immutable ledger) ─────────────────────────────────────────────

    findInvoices() {
      return db.select().from(subscriptionInvoice)
        .where(invScope)
        .orderBy(desc(subscriptionInvoice.createdAt))
    },

    findInvoiceById(id: string) {
      return db.select().from(subscriptionInvoice)
        .where(and(invScope, eq(subscriptionInvoice.id, id)))
        .then(r => r[0] ?? null)
    },

    async createInvoice(data: Omit<NewSubscriptionInvoice, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewSubscriptionInvoice = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(subscriptionInvoice).values(row)
      return row
    },

    async markInvoice(id: string, data: Partial<Pick<SubscriptionInvoice, 'status' | 'providerRef' | 'idempotencyKey' | 'paidAt'>>) {
      await db.update(subscriptionInvoice)
        .set(data)
        .where(and(invScope, eq(subscriptionInvoice.id, id)))
      return this.findInvoiceById(id)
    },

    async countPaidThisPeriod(from: Date, to: Date): Promise<number> {
      const r = await db.select({ n: sql<number>`COUNT(*)` })
        .from(subscriptionInvoice)
        .where(and(invScope, eq(subscriptionInvoice.status, 'PAID'), gte(subscriptionInvoice.paidAt, from as any), lte(subscriptionInvoice.paidAt, to as any)))
      return r[0]?.n ?? 0
    },
  }
}

export type SubscriptionsRepository = ReturnType<typeof createSubscriptionsRepository>
