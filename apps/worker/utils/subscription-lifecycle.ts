import { eq } from 'drizzle-orm'
import { subscription, organization } from '@repo/database/schema'
import type { Database, Subscription } from '@repo/database'

export const GRACE_DAYS = 7

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

function addCycle(d: Date, cycle: 'MONTHLY' | 'YEARLY'): Date {
  const r = new Date(d)
  if (cycle === 'YEARLY') r.setFullYear(r.getFullYear() + 1)
  else r.setMonth(r.getMonth() + 1)
  return r
}

async function syncOrgStatus(db: Database, organizationId: string, status: Subscription['status']) {
  await db.update(organization)
    .set({ status, updatedAt: new Date() })
    .where(eq(organization.id, organizationId))
}

/**
 * Lazily advances a subscription through its lifecycle based on the clock.
 * Idempotent — safe to call on every access. Persists transitions and mirrors
 * the resulting status onto organization.status (the tenant edge gate).
 */
export async function evaluateSubscription(db: Database, organizationId: string, now = new Date()): Promise<Subscription | null> {
  const [sub] = await db.select().from(subscription).where(eq(subscription.organizationId, organizationId)).limit(1)
  if (!sub) return null

  let next: Subscription['status'] = sub.status
  const patch: Partial<Subscription> = {}

  if (sub.status === 'TRIAL' && sub.trialEndsAt && now > sub.trialEndsAt) {
    next = 'EXPIRED'
    if (!sub.graceEndsAt) patch.graceEndsAt = addDays(sub.trialEndsAt, GRACE_DAYS)
  } else if (sub.status === 'ACTIVE' && sub.currentPeriodEnd && now > sub.currentPeriodEnd) {
    next = 'EXPIRED'
    if (!sub.graceEndsAt) patch.graceEndsAt = addDays(sub.currentPeriodEnd, GRACE_DAYS)
  } else if (sub.status === 'EXPIRED' && sub.graceEndsAt && now > sub.graceEndsAt) {
    next = 'SUSPENDED'
  }

  if (next === sub.status && Object.keys(patch).length === 0) return sub

  patch.status = next
  patch.updatedAt = now
  await db.update(subscription).set(patch).where(eq(subscription.organizationId, organizationId))
  await syncOrgStatus(db, organizationId, next)
  return { ...sub, ...patch }
}

/** Activates/renews a subscription from a verified paid invoice. */
export async function activateSubscription(
  db: Database,
  organizationId: string,
  planId: string,
  cycle: 'MONTHLY' | 'YEARLY',
  now = new Date(),
): Promise<void> {
  const periodEnd = addCycle(now, cycle)
  await db.update(subscription)
    .set({
      planId,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      graceEndsAt: null,
      trialEndsAt: null,
      updatedAt: now,
    })
    .where(eq(subscription.organizationId, organizationId))
  await syncOrgStatus(db, organizationId, 'ACTIVE')
}
