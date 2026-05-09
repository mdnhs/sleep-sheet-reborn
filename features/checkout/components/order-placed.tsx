"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useAppSelector } from "@/store/hooks";
import GuestAccountPrompt from "./guest-account-prompt";

function OrderPlaced() {
  const shippingInfo = useAppSelector((state) => state.checkout.shippingInfo);

  return (
    <div className="w-full -mt-20">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <CheckCircle className="h-20 w-20 text-green-500 animate-pulse mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Thank You!
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mb-2">
          Your order has been placed successfully.
        </p>
        {shippingInfo?.phone && (
          <p className="text-sm text-muted-foreground mb-6">
            Track your order anytime with your phone number:{" "}
            <span className="font-medium text-foreground">{shippingInfo.phone}</span>
          </p>
        )}

        <div className="flex gap-4 flex-wrap justify-center mb-6">
          <Link href="/track-order">
            <Button variant="outline">Track My Order</Button>
          </Link>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <GuestAccountPrompt />
        </div>
      </div>
    </div>
  );
}

export default OrderPlaced;
