"use client";
import CheckoutSteps from "@/features/checkout/components/checkout-steps";
import OrderPlaced from "@/features/checkout/components/order-placed";
import OrderSummeryCard from "@/features/checkout/components/order-summery-card";
import PreviewStepCard from "@/features/checkout/components/preview-step-card";
import ShippingInformationCard from "@/features/checkout/components/shipping-information-card";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import React, { useEffect } from "react";
import { setStep } from "@/features/checkout/state/checkoutSlice";

function CheckoutClinet() {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector((state) => state.checkout.currentStep);
  const cartItems = useAppSelector((state) => state.cart.items);
  const guestItems = useAppSelector((state) => state.cart.guestItems);

  useEffect(() => {
    // If the user has a success message but their cart is not empty, they clicked Buy Now again
    if (currentStep === "placedSuccessfully" && (cartItems.length > 0 || guestItems.length > 0)) {
      dispatch(setStep("initial"));
    }
  }, [currentStep, cartItems.length, guestItems.length, dispatch]);

  return (
    <div className="container mx-auto px-3 pb-4 pt-1 max-w-5xl">
      <CheckoutSteps />
      <div className="flex flex-col lg:flex-row items-start gap-4 mt-2">
        <div className="w-full lg:w-3/5 order-2 lg:order-1">
          {currentStep === "initial" && <ShippingInformationCard />}
          {currentStep === "confirmation" && <PreviewStepCard />}
          {currentStep === "placedSuccessfully" && <OrderPlaced />}
        </div>
        {currentStep !== "placedSuccessfully" && (
          <div className="w-full lg:w-2/5 order-1 lg:order-2 lg:sticky lg:top-20">
            <OrderSummeryCard />
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutClinet;
