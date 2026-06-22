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
    <div className="container mx-auto px-4 pb-4 md:pb-8 pt-2 max-w-7xl min-h-[80vh]">
      <CheckoutSteps />
      <div className="flex flex-col-reverse lg:flex-row items-start gap-6 lg:gap-10 mt-2 md:mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {currentStep === "initial" && <ShippingInformationCard />}
        {currentStep === "confirmation" && <PreviewStepCard />}
        {currentStep === "placedSuccessfully" && <OrderPlaced />}
        {currentStep !== "placedSuccessfully" && <OrderSummeryCard />}
      </div>
    </div>
  );
}

export default CheckoutClinet;
