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
    <div className="w-full">
      <div className="flex flex-col items-center justify-center px-4 text-center py-6">
        <CheckCircle className="h-12 w-12 text-green-500 animate-pulse mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-1">Thank You!</h1>
        <p className="text-muted-foreground text-sm max-w-md mb-2">
          Your order has been placed successfully.
        </p>
        {shippingInfo?.phone && (
          <p className="text-xs text-muted-foreground mb-4">
            Track with phone:{" "}
            <span className="font-medium text-foreground">{shippingInfo.phone}</span>
          </p>
        )}

        <div className="flex gap-3 flex-wrap justify-center mb-4">
          <Link href="/track-order">
            <Button variant="outline" size="sm">Track My Order</Button>
          </Link>
          <Link href="/">
            <Button size="sm">Continue Shopping</Button>
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
