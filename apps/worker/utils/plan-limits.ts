import { eq, and } from 'drizzle-orm'
import { subscription, subscriptionPlan, featureFlag } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { ServiceError } from './service-error'

type LimitKey =
  | 'limitProducts' | 'limitOutlets' | 'limitWarehouses'
  | 'limitUsers' | 'limitFunnels' | 'limitThemes' | 'limitOrdersPerMonth'

async function getPlanLimits(db: Database, organizationId: string) {
  const [row] = await db.select({
    limitProducts: subscriptionPlan.limitProducts,
    limitOutlets: subscriptionPlan.limitOutlets,
    limitWarehouses: subscriptionPlan.limitWarehouses,
    limitUsers: subscriptionPlan.limitUsers,
    limitFunnels: subscriptionPlan.limitFunnels,
    limitThemes: subscriptionPlan.limitThemes,
    limitOrdersPerMonth: subscriptionPlan.limitOrdersPerMonth,
    featureFlags: subscriptionPlan.featureFlags,
    status: subscription.status,
  })
    .from(subscription)
    .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
    .where(eq(subscription.organizationId, organizationId))
    .limit(1)

  return row ?? null
}

/** TRIAL and ACTIVE may write. EXPIRED/SUSPENDED/CANCELLED are blocked (402). */
export async function enforceSubscriptionActive(db: Database, organizationId: string) {
  const limits = await getPlanLimits(db, organizationId)
  if (!limits) return // no subscription yet = trial; allow
  if (limits.status === 'EXPIRED') throw new ServiceError('SUBSCRIPTION_EXPIRED: subscription expired', 402)
  if (limits.status === 'SUSPENDED') throw new ServiceError('SUBSCRIPTION_SUSPENDED: subscription suspended', 402)
  if (limits.status === 'CANCELLED') throw new ServiceError('SUBSCRIPTION_CANCELLED: subscription cancelled', 402)
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
    throw new ServiceError(`PLAN_LIMIT_EXCEEDED: plan limit reached (${limitKey})`, 422)
  }
}

/** Effective feature flags = plan JSON, overridden by per-org feature_flag rows. */
export async function getEffectiveFlags(db: Database, organizationId: string): Promise<Record<string, boolean>> {
  const limits = await getPlanLimits(db, organizationId)
  let flags: Record<string, boolean> = {}
  if (limits?.featureFlags) {
    try { flags = JSON.parse(limits.featureFlags) as Record<string, boolean> } catch { flags = {} }
  }
  const overrides = await db.select().from(featureFlag).where(eq(featureFlag.organizationId, organizationId))
  for (const o of overrides) flags[o.flag] = o.enabled
  return flags
}

export async function isFeatureEnabled(db: Database, organizationId: string, flag: string): Promise<boolean> {
  // explicit per-org override wins
  const [override] = await db.select().from(featureFlag)
    .where(and(eq(featureFlag.organizationId, organizationId), eq(featureFlag.flag, flag)))
    .limit(1)
  if (override) return override.enabled
  const flags = await getEffectiveFlags(db, organizationId)
  return flags[flag] === true
}

/** Throws 403 FEATURE_DISABLED when the feature is not enabled for the org. */
export async function requireFeature(db: Database, organizationId: string, flag: string) {
  const enabled = await isFeatureEnabled(db, organizationId, flag)
  if (!enabled) throw new ServiceError(`FEATURE_DISABLED: feature '${flag}' is not available on your plan`, 403)
}
