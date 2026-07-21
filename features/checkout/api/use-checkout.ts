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

interface useCheckoutProps {
  paymentInfo: Partial<PaymentInformationFormValues>;
  paymentMethod: "cod" | "card";
  shippingInfo: ShippingInformationFormValues;
}

export const UseCheckout = () => {
  const guestItems = useCartStore((state) => state.guestItems);
  const userItems = useCartStore((state) => state.items);
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

      // NOTE: Purchase is intentionally NOT tracked from the browser Pixel.
      // It is reported to Meta ONLY server-side via the Conversions API
      // (`sendPurchaseEventOnce` in features/checkout/server/route.ts), which
      // is gated per-order by `orders.metaPurchaseEventSentAt` so a single
      // order can never fire more than one Purchase. The browser Pixel fire
      // was removed because it is not gated by any DB row — a success-page
      // reload/revisit or a repeated onSuccess could fire it multiple times
      // for one order, over-counting the conversion in Meta. All other Pixel
      // events (PageView, ViewContent, AddToCart, InitiateCheckout) are
      // unaffected and still fire client-side.

      if (orderId) {
        // Brief delay so the success toast and cart-clear settle before the
        // full-page navigation to the success screen.
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
