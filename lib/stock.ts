import { sql } from "drizzle-orm";
import { invalidateFeed } from "@/lib/meta-catalog/cache";

/**
 * Query for an atomic, oversell-proof stock decrement — call `db.execute()`
 * on the result, or include it as one item in a `db.batch([...])` alongside
 * the order/order_items/payment inserts it must succeed or fail with.
 *
 * Backed by the `decrement_stock_or_fail` DB function (see
 * db/migrations/0014_atomic_stock_decrement.sql). Each item is checked and
 * decremented in the same statement it's read in, so two concurrent sales of
 * the last unit can't both pass a "is there enough stock" check that was run
 * separately from the decrement. If any item doesn't have enough stock, the
 * function raises and the whole enclosing transaction/batch rolls back —
 * nothing is oversold and no order is left orphaned with un-decremented stock.
 *
 * Quantities are summed per product first: the same product can appear on
 * two lines (different size/colour), and the function decrements per
 * productId once.
 */
export function stockDecrementQuery(items: { productId: string; quantity: number }[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!item.productId) continue;
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }
  const payload = [...totals.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  return sql`select decrement_stock_or_fail(${JSON.stringify(payload)}::jsonb)`;
}

/** The productId that failed stock check, if `error` came from `decrement_stock_or_fail`. */
export function insufficientStockProductId(error: unknown): string | null {
  const message = (error as { message?: string })?.message ?? String(error);
  const match = /INSUFFICIENT_STOCK:(\S+)/.exec(message);
  return match?.[1] ?? null;
}

/**
 * Product reads are served from the "products" cache tag, so a sale has to
 * drop it — otherwise a sold-out item keeps showing its old stock until the
 * cache window expires. Call after a stock-decrementing batch commits.
 */
export function invalidateStockCache() {
  invalidateFeed();
}
