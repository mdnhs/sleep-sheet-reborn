import { eq } from 'drizzle-orm'
import { subscription, subscriptionInvoice } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { createSubscriptionsRepository } from '../../repositories/subscriptions.repository'
import { createSubscriptionPlansRepository } from '../../repositories/subscription-plans.repository'
import { createAuditLogRepository } from '../../repositories/audit-log.repository'
import { ServiceError } from '../../utils/service-error'
import { evaluateSubscription, activateSubscription } from '../../utils/subscription-lifecycle'
import { getUsage } from '../../utils/usage'
import { verifyWebhook, isValidProvider, type WebhookPayload, type ProviderName } from './billing-providers'

const TRIAL_DAYS = 14
const FREE_PLAN_ID = 'plan_free'

/** Tenant-scoped billing service (the org's own subscription + invoices). */
export function createBillingService(db: Database, organizationId: string) {
  const subRepo = createSubscriptionsRepository(db, organizationId)
  const planRepo = createSubscriptionPlansRepository(db)
  const auditRepo = createAuditLogRepository(db, organizationId)

  /** Lazily provisions a TRIAL subscription on the Free plan if none exists. */
  async function ensureSubscription() {
    const existing = await subRepo.findSubscription()
    if (existing) return existing
    const now = new Date()
    const created = await subRepo.createSubscription({
      planId: FREE_PLAN_ID,
      status: 'TRIAL',
      trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      currentPeriodStart: null,
      currentPeriodEnd: null,
      graceEndsAt: null,
      autoRenew: true,
    })
    await auditRepo.log('subscription', created.id, 'create', undefined, { planId: FREE_PLAN_ID, status: 'TRIAL' })
    return created
  }

  return {
    async getSubscription() {
      await ensureSubscription()
      const sub = await evaluateSubscription(db, organizationId)
      const plan = sub ? await planRepo.findById(sub.planId) : null
      return { subscription: sub, plan }
    },

    listPlans() {
      return planRepo.findMany(true)
    },

    async getUsage() {
      const { plan } = await this.getSubscription()
      const usage = await getUsage(db, organizationId)
      return {
        usage,
        limits: plan ? {
          products: plan.limitProducts,
          outlets: plan.limitOutlets,
          warehouses: plan.limitWarehouses,
          users: plan.limitUsers,
          ordersThisMonth: plan.limitOrdersPerMonth,
        } : null,
      }
    },

    listInvoices() {
      return subRepo.findInvoices()
    },

    /** Creates a PENDING invoice for the chosen plan; returns a checkout handle. */
    async createCheckout(data: { planId: string; provider: ProviderName; actorId?: string }) {
      if (!isValidProvider(data.provider) || data.provider === 'MANUAL') {
        throw new ServiceError('Invalid payment provider', 400)
      }
      const plan = await planRepo.findById(data.planId)
      if (!plan || plan.status !== 'ACTIVE') throw new ServiceError('Plan not found', 404)
      const sub = await ensureSubscription()

      const invoice = await subRepo.createInvoice({
        subscriptionId: sub.id,
        planId: plan.id,
        invoiceNumber: `INV-${Date.now()}`,
        provider: data.provider,
        amount: plan.price,
        status: 'PENDING',
        providerRef: null,
        idempotencyKey: null,
        periodStart: null,
        periodEnd: null,
        paidAt: null,
      })
      await auditRepo.log('subscription_invoice', invoice.id, 'create', data.actorId, { planId: plan.id, amount: plan.price, provider: data.provider })

      // Real providers return a redirect URL after server-to-server init.
      return { invoice, checkoutUrl: `/billing/checkout/${invoice.id}` }
    },

    async cancel(actorId?: string) {
      const sub = await ensureSubscription()
      await subRepo.updateSubscription({ status: 'CANCELLED', autoRenew: false })
      await auditRepo.log('subscription', sub.id, 'cancel', actorId, {})
      return subRepo.findSubscription()
    },
  }
}

/**
 * Processes an inbound provider webhook. UNSCOPED (the request has no tenant
 * context); the org is resolved from the referenced invoice. Verified +
 * idempotent: a duplicate event for an already-paid invoice is a no-op.
 */
export async function processBillingWebhook(
  db: Database,
  provider: string,
  body: Partial<WebhookPayload>,
  secret?: string,
): Promise<{ ok: true; alreadyProcessed: boolean }> {
  if (!isValidProvider(provider)) throw new ServiceError('Unknown provider', 404)
  if (!verifyWebhook(body, secret)) throw new ServiceError('Invalid webhook signature', 401)

  const payload = body as WebhookPayload

  const [invoice] = await db.select().from(subscriptionInvoice)
    .where(eq(subscriptionInvoice.id, payload.invoiceId)).limit(1)
  if (!invoice) throw new ServiceError('Invoice not found', 404)
  if (invoice.provider !== provider) throw new ServiceError('Provider mismatch', 400)

  // Idempotency: terminal invoices are never reprocessed.
  if (invoice.status === 'PAID' || invoice.status === 'REFUNDED') {
    return { ok: true, alreadyProcessed: true }
  }

  const now = new Date()

  if (payload.status === 'failed') {
    await db.update(subscriptionInvoice)
      .set({ status: 'FAILED', providerRef: payload.providerRef, idempotencyKey: payload.idempotencyKey })
      .where(eq(subscriptionInvoice.id, invoice.id))
    return { ok: true, alreadyProcessed: false }
  }

  // success → mark PAID and activate/renew the subscription
  const [sub] = await db.select().from(subscription)
    .where(eq(subscription.id, invoice.subscriptionId)).limit(1)
  if (!sub) throw new ServiceError('Subscription not found', 404)

  await db.update(subscriptionInvoice)
    .set({ status: 'PAID', providerRef: payload.providerRef, idempotencyKey: payload.idempotencyKey, paidAt: now })
    .where(eq(subscriptionInvoice.id, invoice.id))

  if (invoice.planId) {
    await activateSubscription(db, invoice.organizationId, invoice.planId, 'MONTHLY', now)
  }

  return { ok: true, alreadyProcessed: false }
}
