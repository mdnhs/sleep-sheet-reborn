import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PaymentInformationFormValues,
  ShippingInformationFormValues
} from "../schema";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart, clearGuestCart } from "@/features/cart/state/cart-slice";
import { setStep } from "../state/checkoutSlice";

interface useCheckoutProps {
  paymentInfo: Partial<PaymentInformationFormValues>;
  paymentMethod: "cod" | "card";
  shippingInfo: ShippingInformationFormValues;
}

export const UseCheckout = () => {
  const dispatch = useAppDispatch();
  const guestItems = useAppSelector((state) => state.cart.guestItems);

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

    onSuccess: () => {
      toast.success("Order placed successfully!");
      dispatch(setStep("placedSuccessfully"));
      dispatch(clearCart());
      dispatch(clearGuestCart());
      try { localStorage.removeItem("guest-cart"); } catch { /* ignore */ }
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
