import { db } from "@/db";
import { products } from "@/db/schema";
import { inArray, sql, type SQL } from "drizzle-orm";
import { invalidateFeed } from "@/lib/meta-catalog/cache";

/**
 * Decrement stock for a whole order in ONE statement.
 *
 * Each checkout/POS sale used to loop over its line items and issue a separate
 * UPDATE per item. On the serverless HTTP driver every one of those is its own
 * round trip to the database, so a five-item order cost five wake-ups instead
 * of one.
 *
 * Quantities are summed per product first: the same product can appear on two
 * lines (different size/colour), and `CASE id WHEN` can only match once.
 */
export async function decrementStock(
  items: { productId: string; quantity: number }[]
): Promise<void> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!item.productId) continue;
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }
  if (totals.size === 0) return;

  const cases: SQL[] = [];
  for (const [productId, quantity] of totals) {
    cases.push(sql`when ${products.id} = ${productId} then ${quantity}`);
  }

  await db
    .update(products)
    .set({
      stock: sql`${products.stock} - (case ${sql.join(cases, sql.raw(" "))} else 0 end)`,
    })
    .where(inArray(products.id, [...totals.keys()]));

  // Product reads are served from the "products" cache tag, so a sale has to
  // drop it — otherwise a sold-out item keeps showing its old stock until the
  // cache window expires.
  invalidateFeed();
}
