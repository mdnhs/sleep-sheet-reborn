import { eq, desc } from 'drizzle-orm'
import { organization, subscription, subscriptionPlan, subscriptionInvoice } from '@repo/database/schema'
import type { Database, NewSubscriptionPlan, SubscriptionPlan } from '@repo/database'
import { createSubscriptionPlansRepository } from '../../repositories/subscription-plans.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'
import { activateSubscription } from '../../utils/subscription-lifecycle'

/** Platform (SUPER_ADMIN) billing administration. UNSCOPED — operates across orgs. */
export function createPlatformBillingService(db: Database) {
  const planRepo = createSubscriptionPlansRepository(db)

  return {
    // ── Plans ───────────────────────────────────────────────────────────────────

    listPlans() {
      return planRepo.findMany(false)
    },

    async createPlan(data: Omit<NewSubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) {
      return planRepo.create(data)
    },

    async updatePlan(id: string, data: Partial<Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>>) {
      const existing = await planRepo.findById(id)
      if (!existing) throw new ServiceError('Plan not found', 404)
      return planRepo.update(id, data)
    },

    // ── Subscriptions across orgs ────────────────────────────────────────────────

    async listSubscriptions() {
      const rows = await db.select({
        organizationId: organization.id,
        organizationName: organization.name,
        slug: organization.slug,
        orgStatus: organization.status,
        subscriptionId: subscription.id,
        status: subscription.status,
        planId: subscription.planId,
        planName: subscriptionPlan.name,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
      })
        .from(organization)
        .leftJoin(subscription, eq(subscription.organizationId, organization.id))
        .leftJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
        .orderBy(organization.name)
      return rows
    },

    listInvoices(organizationId: string) {
      return db.select().from(subscriptionInvoice)
        .where(eq(subscriptionInvoice.organizationId, organizationId))
        .orderBy(desc(subscriptionInvoice.createdAt))
    },

    async setOrgSubscriptionStatus(organizationId: string, status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED', actorId?: string) {
      const [sub] = await db.select().from(subscription).where(eq(subscription.organizationId, organizationId)).limit(1)
      if (!sub) throw new ServiceError('Subscription not found', 404)
      const now = new Date()
      await db.update(subscription).set({ status, updatedAt: now }).where(eq(subscription.organizationId, organizationId))
      await db.update(organization).set({ status, updatedAt: now }).where(eq(organization.id, organizationId))
      const audit = createAuditLogRepository(db, organizationId)
      await audit.log('subscription', sub.id, `admin_${status.toLowerCase()}`, actorId, {})
      return { ok: true }
    },

    /** Manually activate/renew an org's subscription on a plan (no payment). */
    async manualActivate(organizationId: string, planId: string, actorId?: string) {
      const plan = await planRepo.findById(planId)
      if (!plan) throw new ServiceError('Plan not found', 404)
      const [sub] = await db.select().from(subscription).where(eq(subscription.organizationId, organizationId)).limit(1)
      if (!sub) throw new ServiceError('Subscription not found', 404)
      await activateSubscription(db, organizationId, planId, plan.billingCycle)
      const audit = createAuditLogRepository(db, organizationId)
      await audit.log('subscription', sub.id, 'admin_activate', actorId, { planId })
      return { ok: true }
    },
  }
}

export type PlatformBillingService = ReturnType<typeof createPlatformBillingService>
