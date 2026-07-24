import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PaymentInformationFormValues,
  ShippingInformationFormValues
} from "../schema";
import { useCartStore } from "@/features/cart/state/use-cart-store";
import {
  getOrCreateCheckoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
} from "@/lib/checkout-idempotency";
import { usePixelTracking } from "@/lib/meta-pixel";
import type { PurchaseTrackingPayload } from "@/lib/meta-purchase-event";

const trackedBrowserPurchaseOrderIds = new Set<string>();

interface useCheckoutProps {
  paymentInfo: Partial<PaymentInformationFormValues>;
  paymentMethod: "cod" | "card";
  shippingInfo: ShippingInformationFormValues;
}

export const UseCheckout = () => {
  const guestItems = useCartStore((state) => state.guestItems);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearGuestCart = useCartStore((state) => state.clearGuestCart);
  const { track } = usePixelTracking();

  return useMutation({
    mutationFn: async ({
      paymentInfo,
      paymentMethod,
      shippingInfo,
    }: useCheckoutProps) => {
      const payload = {
        shippingInfo,
        paymentInfo: {
          paymentMethod,
          cardNumber: paymentInfo?.cardNumber,
          expirationDate: paymentInfo?.expirationDate,
          cvv: paymentInfo?.cvv,
          nameOnCard: paymentInfo?.nameOnCard,
        },
        guestItems: guestItems.length > 0 ? guestItems : undefined,
        // Same key for every submit of this cart, so a duplicate submit returns
        // the existing order instead of creating a second one.
        idempotencyKey: getOrCreateCheckoutIdempotencyKey(),
      };

      const response = await client.api.checkout.$post({ json: payload });

      if (!response.ok) {
        throw new Error("Failed to checkout");
      }

      return response.json();
    },

    onSuccess: (data, variables) => {
      toast.success("Order placed successfully!");
      clearCart();
      clearGuestCart();
      try { localStorage.removeItem("guest-cart"); } catch { /* ignore */ }
      // Order is placed — retire this key so the customer's next checkout
      // starts a fresh idempotency window.
      clearCheckoutIdempotencyKey();

      const orderId =
        (data as { orderId?: string }).orderId ??
        (data as { order?: { id?: string } }).order?.id;

      const purchase = (data as { purchase?: PurchaseTrackingPayload }).purchase;
      if (purchase?.orderId && purchase.eventId) {
        const guardKey = `fb_purchase_tracked_${purchase.orderId}`;
        let alreadyTracked = trackedBrowserPurchaseOrderIds.has(purchase.orderId);
        try {
          alreadyTracked = alreadyTracked || sessionStorage.getItem(guardKey) === "1";
        } catch {
          /* sessionStorage unavailable */
        }

        if (!alreadyTracked) {
          trackedBrowserPurchaseOrderIds.add(purchase.orderId);
          try {
            sessionStorage.setItem(guardKey, "1");
          } catch {
            /* sessionStorage unavailable */
          }

          track(
            "Purchase",
            {
              value: purchase.value,
              currency: purchase.currency,
              order_id: purchase.orderId,
              content_type: "product",
              content_ids: purchase.contents.map((c) => c.id),
              contents: purchase.contents,
              quantity: purchase.numItems,
            },
            { eventId: purchase.eventId },
          );
        }
      }

      if (orderId) {
        // Brief delay so the Pixel beacon can enqueue before full-page navigation.
        setTimeout(() => {
          window.location.href = `/order-success?orderId=${orderId}&phone=${encodeURIComponent(variables.shippingInfo.phone)}`;
        }, 300);
      }
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
