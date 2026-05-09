"use client";
import CheckoutSteps from "@/features/checkout/components/checkout-steps";
import OrderPlaced from "@/features/checkout/components/order-placed";
import OrderSummeryCard from "@/features/checkout/components/order-summery-card";
import PreviewStepCard from "@/features/checkout/components/preview-step-card";
import ShippingInformationCard from "@/features/checkout/components/shipping-information-card";

import { useAppSelector } from "@/store/hooks";
import React from "react";

function CheckoutClinet() {
  const currentStep = useAppSelector((state) => state.checkout.currentStep);

  return (
    <div className="container mx-auto p-4">
      <CheckoutSteps />
      <div className="flex flex-col-reverse lg:flex-row items-start gap-8 mt-16">
        {currentStep === "initial" && <ShippingInformationCard />}
        {currentStep === "confirmation" && <PreviewStepCard />}
        {currentStep === "placedSuccessfully" && <OrderPlaced />}
        {currentStep !== "placedSuccessfully" && <OrderSummeryCard />}
      </div>
    </div>
  );
}

export default CheckoutClinet;
