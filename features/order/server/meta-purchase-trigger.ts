import { db } from "@/db";
import { orders, siteSettings } from "@/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCapiReadiness, sendPurchaseEventOnce, type CapiRequestContext } from "@/lib/meta-capi";
import { purchaseEventId } from "@/lib/meta-purchase-event";
import {
  buildGtmPurchaseRequest,
  evaluateGtmPurchaseSettings,
  sendGtmPurchase,
  type PurchaseOrderInput,
} from "./gtm-purchase";

export type PurchaseDispatchResult =
  | { ok: true; via: "gtm" | "capi" }
  | { ok: false; status: 400 | 502; code: string; message: string };

const SETTING_KEYS = [
  "gtm_purchase_endpoint",
  "gtm_purchase_api_secret",
  "google_analytics_id",
  "meta_capi_test_event_code",
];

// Read straight from the database rather than the 60s in-process cache in
// lib/settings-cache: an admin saving the setting and pressing Confirm a
// moment later can land on another instance whose cache is still stale.
async function loadSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings).where(inArray(siteSettings.key, SETTING_KEYS));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/**
 * Report a confirmed order's Purchase, exactly once.
 *
 * COD fraud protection: an order is PENDING when placed and no Purchase goes
 * anywhere. The success pages push `order_placed`, which no GTM tag listens
 * to. Only when staff confirm the order does this run, so a fake or spam order
 * never reaches Meta's or Google's optimisation.
 *
 * Two destinations, and never both — sending to each would count the sale
 * twice:
 *   1. the GTM server container, which fans out to GA4 and Meta CAPI. Used
 *      whenever its URL is set.
 *   2. the app's own direct Meta CAPI, only as a fallback when no container
 *      URL is set.
 *
 * Idempotent through orders.metaPurchaseEventSentAt, claimed before sending
 * and released if the send fails, so a retry is possible and a double click is
 * not. (The column predates the GTM path and is named for Meta.)
 */
export async function triggerPurchaseOnConfirmation(
  orderId: string,
  opts: { sourceUrl?: string } = {},
): Promise<PurchaseDispatchResult> {
  try {
    const settings = await loadSettings();
    const gtm = evaluateGtmPurchaseSettings(settings);

    let via: "gtm" | "capi";
    // Kept as its own binding: TypeScript cannot carry the narrowing of
    // `gtm.ready` through the `via` flag to the send further down.
    const gtmConfig = gtm.ready ? gtm.config : undefined;
    if (gtmConfig) {
      via = "gtm";
    } else if (!gtm.ready && gtm.reason !== "not_configured") {
      // Configured but wrong. Say so, instead of quietly falling back to a
      // different destination than the one the admin set up.
      return { ok: false, status: 400, code: `gtm_${gtm.reason}`, message: gtm.message };
    } else {
      const capi = await getCapiReadiness();
      if (!capi.ready) {
        return {
          ok: false,
          status: 400,
          code: "no_destination",
          message: "No place to send the Purchase is set up. Add the GTM server container URL under Settings > Purchase events.",
        };
      }
      via = "capi";
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: { with: { product: { columns: { name: true } } } } },
    });

    if (!order) {
      return { ok: false, status: 400, code: "not_found", message: "Order not found." };
    }
    if (order.metaPurchaseEventSentAt) {
      return { ok: false, status: 400, code: "already_sent", message: "The Purchase event has already been sent for this order." };
    }
    // Never report POS, cancelled or refunded orders.
    if (order.saleType === "POS" || order.status === "CANCELLED" || order.status === "REFUNDED") {
      return { ok: false, status: 400, code: "not_eligible", message: "This order is not eligible for a Purchase event." };
    }

    const orderNumber = order.orderNumber || order.id;

    if (via === "capi") {
      const contents = (order.items || []).map((item) => ({
        id: item.productId || item.id,
        quantity: item.quantity,
        item_price: item.price,
      }));
      const ctx: CapiRequestContext = {
        ipAddress: order.ipAddress || undefined,
        userAgent: order.userAgent || undefined,
        sourceUrl: opts.sourceUrl,
      };
      const sent = await sendPurchaseEventOnce(
        {
          eventId: purchaseEventId(orderNumber),
          value: order.totalAmount,
          currency: "BDT",
          orderId: order.id,
          orderNumber,
          contents,
          numItems: contents.reduce((sum, item) => sum + item.quantity, 0),
          customer: {
            email: order.guestEmail || undefined,
            phone: order.guestPhone || undefined,
            fullName: order.guestName || undefined,
          },
          externalId: order.userId || undefined,
          fbc: order.fbc || null,
        },
        ctx,
      );
      if (!sent) {
        return {
          ok: false,
          status: 502,
          code: "capi_rejected",
          message: "Meta did not accept the Purchase event. Check the Pixel ID and access token under Settings > Purchase events (and Test Events in Events Manager if a test code is set).",
        };
      }
      return { ok: true, via };
    }

    // GTM server container. Claim the order first, so a double click cannot
    // send it twice, and give the claim back if the send fails.
    if (!gtmConfig) {
      // Unreachable: `via` is "gtm" only when gtmConfig was set, and the "capi"
      // branch has already returned. Present so the types need no assertion.
      return { ok: false, status: 502, code: "unexpected", message: "No GTM configuration was resolved." };
    }
    const claimed = await db
      .update(orders)
      .set({ metaPurchaseEventSentAt: new Date() })
      .where(and(eq(orders.id, order.id), isNull(orders.metaPurchaseEventSentAt)))
      .returning({ id: orders.id });
    if (claimed.length === 0) {
      return { ok: false, status: 400, code: "already_sent", message: "The Purchase event has already been sent for this order." };
    }

    const request = buildGtmPurchaseRequest(order as PurchaseOrderInput, gtmConfig, opts.sourceUrl);
    const result = await sendGtmPurchase(request);

    if (!result.ok) {
      try {
        await db.update(orders).set({ metaPurchaseEventSentAt: null }).where(eq(orders.id, order.id));
      } catch (err) {
        console.error("[GtmPurchase] could not release the claim on", order.id, err);
      }
      return {
        ok: false,
        status: 502,
        code: "gtm_rejected",
        message: `The GTM server container did not accept the Purchase (${result.detail}). Check the container URL under Settings > Purchase events, and that its GA4 client is active.`,
      };
    }

    console.log(`[Purchase] Sent #${orderNumber} (${order.totalAmount} BDT) to the GTM server container`);
    return { ok: true, via };
  } catch (error) {
    console.error(`[Purchase] Error triggering Purchase event for order ${orderId}:`, error);
    return {
      ok: false,
      status: 502,
      code: "unexpected",
      message: "Something went wrong while sending the Purchase event. See the server log.",
    };
  }
}
