import { eq } from 'drizzle-orm'
import { subscription, subscriptionPlan } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { ServiceError } from './service-error'

type LimitKey = 'limitProducts' | 'limitOutlets' | 'limitWarehouses' | 'limitUsers' | 'limitFunnels' | 'limitThemes'

async function getPlanLimits(db: Database, organizationId: string) {
  const [row] = await db.select({
    limitProducts: subscriptionPlan.limitProducts,
    limitOutlets: subscriptionPlan.limitOutlets,
    limitWarehouses: subscriptionPlan.limitWarehouses,
    limitUsers: subscriptionPlan.limitUsers,
    limitFunnels: subscriptionPlan.limitFunnels,
    limitThemes: subscriptionPlan.limitThemes,
    status: subscription.status,
  })
    .from(subscription)
    .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
    .where(eq(subscription.organizationId, organizationId))
    .limit(1)

  return row ?? null
}

export async function enforceSubscriptionActive(db: Database, organizationId: string) {
  const limits = await getPlanLimits(db, organizationId)
  if (!limits) return // no subscription yet = trial; allow
  if (limits.status === 'EXPIRED') throw new ServiceError('Subscription expired', 402)
  if (limits.status === 'SUSPENDED') throw new ServiceError('Subscription suspended', 402)
  if (limits.status === 'CANCELLED') throw new ServiceError('Subscription cancelled', 402)
}

export async function enforceLimit(
  db: Database,
  organizationId: string,
  limitKey: LimitKey,
  currentCount: number,
) {
  const limits = await getPlanLimits(db, organizationId)
  if (!limits) return // no subscription = use defaults; skip enforcement
  const limit = limits[limitKey] ?? Infinity
  if (currentCount >= limit) {
    throw new ServiceError(`Plan limit reached (${limitKey})`, 422)
  }
}
