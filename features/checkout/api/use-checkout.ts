import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PaymentInformationFormValues,
  ShippingInformationFormValues
} from "../schema";
import { useCartStore } from "@/features/cart/state/use-cart-store";
import { usePixelTracking } from "@/lib/meta-pixel";

interface PurchasePayload {
  value: number;
  currency: string;
  orderId: string;
  contents: { id: string; quantity: number; item_price: number }[];
  numItems: number;
}

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

      const orderId =
        (data as { orderId?: string }).orderId ??
        (data as { order?: { id?: string } }).order?.id;

      // Browser-side Purchase, fired here on the checkout page (not on the
      // success page). It carries the same deterministic event_id as the
      // server-side CAPI Purchase (`purchase_<orderId>`) so Meta deduplicates
      // the browser + server events into a single conversion.
      const purchase = (data as { purchase?: PurchasePayload }).purchase;
      if (purchase?.orderId) {
        track(
          "Purchase",
          {
            value: purchase.value,
            currency: purchase.currency,
            order_id: purchase.orderId,
            content_type: "product",
            content_ids: purchase.contents.map((c) => c.id),
            contents: purchase.contents.map((c) => ({
              id: c.id,
              quantity: c.quantity,
              item_price: c.item_price,
            })),
            quantity: purchase.numItems,
          },
          { eventId: `purchase_${purchase.orderId}` },
        );
      }

      if (orderId) {
        // Brief delay so the Pixel beacon flushes before the full-page
        // navigation to the success screen.
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
