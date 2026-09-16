import { sql, type SQL } from "drizzle-orm";
import { orders } from "@/db/schema";

/**
 * The status buckets the orders dashboard filters on.
 *
 * These were computed in the browser originally, because a bucket depends on
 * the courier's own `delivery_status` as well as this table's `status` column
 * and only the client had fetched the former. The courier value is persisted
 * on the row now (see the Steadfast route), so the server can define the sets
 * itself — which is what makes the list pageable at all: a set the server
 * cannot define is a set it cannot page through.
 *
 * Two properties are easy to get wrong here, and both misfile orders silently
 * rather than failing:
 *
 *   The buckets overlap. `isConfirmed` is true for a POS showroom sale before
 *   it considers delivery at all, so such an order appears under CONFIRMED
 *   and DELIVERED both. They are not a partition, and nothing should "fix"
 *   that by making them one.
 *
 *   NULL is not false. `courierStatus` is NULL for anything never synced, and
 *   `NULL IN (...)` evaluates to NULL — so `NOT (that)` is NULL too, which
 *   drops the row instead of keeping it. Every courier test is wrapped in
 *   `coalesce(..., false)` for exactly that reason.
 *
 * Extracted from the route handler so both properties are covered by tests
 * (features/order/server/status-buckets.test.ts) against a real Postgres
 * rather than asserted in a comment.
 */

/**
 * The courier status, but only where the dashboard would have had one.
 *
 * The client only ever held courier state for orders it would have fetched it
 * for — tracked, and not already finished. Mirroring that restriction here is
 * what keeps this classification identical to the one the page used to
 * compute; without it, a stale courier value on a completed order would start
 * moving rows between buckets.
 */
export const courierStatusSql: SQL = sql`(CASE WHEN ${orders.trackingNumber} IS NOT NULL AND ${orders.trackingNumber} <> ''
  AND ${orders.status} NOT IN ('DELIVERED','CANCELLED','REFUNDED')
  THEN ${orders.courierStatus} END)`;

export const isCancelledSql: SQL = sql`(${orders.status} = 'CANCELLED'
  OR coalesce(${courierStatusSql} IN ('cancelled','cancelled_approval_pending'), false))`;

export const isReturnedSql: SQL = sql`(${orders.status} = 'REFUNDED'
  OR coalesce(${orders.refundedAmount}, 0) > 0
  OR coalesce(${courierStatusSql} IN ('returned','partial-return','not_delivered','partial-not-delivered'), false))`;

export const isDeliveredSql: SQL = sql`(NOT ${isCancelledSql} AND NOT ${isReturnedSql}
  AND (${orders.status} = 'DELIVERED'
    OR coalesce(${courierStatusSql} IN ('delivered','partial_delivered','delivered_approval_pending','partial_delivered_approval_pending'), false)))`;

export const isConfirmedSql: SQL = sql`(NOT ${isCancelledSql} AND NOT ${isReturnedSql}
  AND ((${orders.saleType} = 'POS'
        AND (${orders.status} = 'DELIVERED'
             OR coalesce(${orders.shippingAddress} ILIKE '%In-store pickup%', false)))
    OR (${orders.trackingNumber} IS NOT NULL AND ${orders.trackingNumber} <> '')
    OR ${orders.status} IN ('PROCESSING','SHIPPED')
    OR coalesce(${courierStatusSql} IN ('pending','in_review','hold','fast-track','hub-transfer','office-delivery'), false)))`;

export const isPendingSql: SQL = sql`(NOT ${isCancelledSql} AND NOT ${isReturnedSql}
  AND NOT ${isConfirmedSql} AND NOT ${isDeliveredSql}
  AND ${orders.status} = 'PENDING')`;

/**
 * The instants bracketing the viewer's own day.
 *
 * "Today" belongs to whoever is looking at the screen, and only their browser
 * knows which day that is — six hours ahead of UTC here, so a UTC day
 * boundary would hide this morning's orders. The client sends its
 * `getTimezoneOffset()`; shifting by it, truncating, and shifting back gives
 * the right pair. Absent the offset this falls back to UTC rather than
 * guessing.
 */
export function todayRange(tzOffset: string | undefined, now = Date.now()): { from: Date; to: Date } {
  const offsetMin = Number.parseInt(tzOffset ?? "", 10);
  const shift = Number.isFinite(offsetMin) ? offsetMin * 60_000 : 0;
  const dayStart = new Date(now - shift);
  dayStart.setUTCHours(0, 0, 0, 0);
  const from = new Date(dayStart.getTime() + shift);
  return { from, to: new Date(from.getTime() + 24 * 60 * 60 * 1000) };
}

export function isTodaySqlFor(range: { from: Date; to: Date }): SQL {
  return sql`(${orders.createdAt} >= ${range.from} AND ${orders.createdAt} < ${range.to})`;
}

/** The bucket a `status` filter value selects, or undefined for "all". */
export function bucketFor(status: string | undefined, todaySql: SQL): SQL | undefined {
  switch (status) {
    case "PENDING": return isPendingSql;
    case "CONFIRMED": return isConfirmedSql;
    case "DELIVERED": return isDeliveredSql;
    case "CANCELLED": return isCancelledSql;
    case "RETURNED": return isReturnedSql;
    case "TODAY": return todaySql;
    default: return undefined;
  }
}
