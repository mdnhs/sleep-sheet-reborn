import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPurchaseEventOnce, type CapiRequestContext } from "@/lib/meta-capi";
import { purchaseEventId } from "@/lib/meta-purchase-event";

/**
 * Triggers a Meta Conversions API (CAPI) Purchase event for a confirmed order.
 *
 * Designed for COD (Cash on Delivery) fraud protection:
 * - When an order is initially created, it is PENDING and no Purchase event is sent.
 * - Only when an admin verifies/confirms the order (status moves to PROCESSING,
 *   SHIPPED, or DELIVERED) or books it with a courier, this function fires.
 * - If an order is fake/spam and gets marked as CANCELLED, this is never called,
 *   completely protecting your Meta Pixel and Ads algorithm from junk audience optimization.
 * - Fully idempotent: orders.metaPurchaseEventSentAt ensures an order conversion is
 *   reported to Meta exactly once.
 */
export async function triggerMetaPurchaseOnConfirmation(orderId: string): Promise<boolean> {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
      },
    });

    if (!order) {
      console.warn(`[MetaPurchase] Order ${orderId} not found`);
      return false;
    }

    // Skip if already sent
    if (order.metaPurchaseEventSentAt) {
      return false;
    }

    // Never send Purchase for POS, cancelled or refunded orders
    if (order.saleType === "POS" || order.status === "CANCELLED" || order.status === "REFUNDED") {
      return false;
    }

    const orderNumber = order.orderNumber || order.id;
    const contents = (order.items || []).map((item) => ({
      id: item.productId || item.id,
      quantity: item.quantity,
      item_price: item.price,
    }));
    const numItems = contents.reduce((sum, item) => sum + item.quantity, 0);

    const ctx: CapiRequestContext = {
      ipAddress: order.ipAddress || undefined,
      userAgent: order.userAgent || undefined,
    };

    const sent = await sendPurchaseEventOnce(
      {
        eventId: purchaseEventId(orderNumber),
        value: order.totalAmount,
        currency: "BDT",
        orderId: order.id,
        orderNumber,
        contents,
        numItems,
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

    if (sent) {
      console.log(`[MetaPurchase] Successfully dispatched confirmed Purchase event to Meta for #${orderNumber} (${order.totalAmount} BDT)`);
    }
    return sent;
  } catch (error) {
    console.error(`[MetaPurchase] Error triggering Purchase event for order ${orderId}:`, error);
    return false;
  }
}
