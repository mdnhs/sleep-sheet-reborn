import type { Database } from '@repo/database'
import { createCustomersService } from './customers.service'
import { createNotificationsService } from './notifications.service'

// 1 loyalty point per 100 currency units spent.
export const LOYALTY_RATE = 100
export const pointsFor = (amount: number) => Math.floor(Math.max(amount, 0) / LOYALTY_RATE)

type Ref = { source: 'ORDER' | 'POS'; type: string; id: string }

/**
 * Cross-module side effects. All best-effort: a failure here must never break the
 * underlying ERP transaction (the sale/refund already succeeded).
 */

export async function awardLoyalty(db: Database, org: string, customerId: string | null | undefined, amount: number, ref: Ref) {
  if (!customerId) return
  const points = pointsFor(amount)
  if (points <= 0) return
  try {
    await createCustomersService(db, org).earnPoints(customerId, { points, source: ref.source, referenceType: ref.type, referenceId: ref.id })
  } catch { /* non-fatal */ }
}

export async function reverseLoyalty(db: Database, org: string, customerId: string | null | undefined, amount: number, ref: { type: string; id: string }) {
  if (!customerId) return
  const points = pointsFor(amount)
  if (points <= 0) return
  try {
    await createCustomersService(db, org).reversePoints(customerId, { points, referenceType: ref.type, referenceId: ref.id })
  } catch { /* non-fatal */ }
}

export async function refundToWallet(db: Database, org: string, customerId: string | null | undefined, amount: number, ref: { type: string; id: string }) {
  if (!customerId || amount <= 0) return
  try {
    await createCustomersService(db, org).creditWallet(customerId, { amount, source: 'REFUND', referenceType: ref.type, referenceId: ref.id, note: 'Refund credited to wallet' })
  } catch { /* non-fatal */ }
}

export async function notifyOrg(db: Database, org: string, n: { title: string; body?: string; type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'; entityType?: string; entityId?: string }) {
  try {
    await createNotificationsService(db, org).create(n)
  } catch { /* non-fatal */ }
}
