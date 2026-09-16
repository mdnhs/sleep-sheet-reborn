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
import { getCapturedFbc } from "@/lib/meta-fbc";
import type { PurchaseTrackingPayload } from "@/lib/meta-purchase-event";
import { trackGtmPurchase, splitFullName } from "@/lib/gtm";

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
        // Meta click-id, captured client-side on landing (see meta-fbc.ts) —
        // sent explicitly so the server-side Purchase CAPI call doesn't have
        // to depend on the Pixel's own _fbc cookie having been set in time.
        fbc: getCapturedFbc(),
      };

      const response = await client.api.checkout.$post({ json: payload });

      if (!response.ok) {
        let errorMsg = "Failed to checkout";
        try {
          const errorData = (await response.json()) as { message?: string; error?: string };
          if (errorData?.message) {
            errorMsg = errorData.message;
          } else if (typeof errorData?.error === "string") {
            errorMsg = errorData.error;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMsg);
      }

      return response.json();
    },

    onSuccess: (data, variables) => {
      // Capture cart items snapshot before clearing to populate actual product names & variants in GTM
      const cartSnapshot = [
        ...useCartStore.getState().items,
        ...useCartStore.getState().guestItems,
      ];
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

          // The browser Purchase is fired by the GTM web container's Meta
          // Pixel tag off the dataLayer push below, deduplicated against the
          // server container's CAPI tag by the shared event_id. The app
          // firing its own was a second, uncoordinated copy.
          const { first_name, last_name } = splitFullName(variables.shippingInfo.fullName);
          trackGtmPurchase({
            transaction_id: purchase.orderId,
            order_id: purchase.orderId,
            value: purchase.value,
            currency: purchase.currency || "BDT",
            user_data: {
              email: variables.shippingInfo.email || undefined,
              phone_number: variables.shippingInfo.phone,
              address: {
                first_name,
                last_name,
                street: variables.shippingInfo.address,
                country: "BD",
              },
              fbc: getCapturedFbc(),
            },
            items: purchase.contents.map((c, idx) => {
              const matched = cartSnapshot.find(
                (item) => item.productId === c.id || item.id === c.id
              );
              return {
                item_id: c.id,
                item_name: matched?.name || `Product ${c.id}`,
                price: c.item_price,
                quantity: c.quantity,
                item_variant: [matched?.size, matched?.color].filter(Boolean).join(" / ") || undefined,
                index: idx + 1,
              };
            }),
          });
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
