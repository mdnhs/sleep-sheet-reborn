"use client";
import OrderSummeryCard from "@/features/checkout/components/order-summery-card";
import ShippingInformationCard from "@/features/checkout/components/shipping-information-card";

import { useCartStore } from "@/features/cart/state/use-cart-store";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function CheckoutClinet() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const guestItems = useCartStore((state) => state.guestItems);
  const totalItems = [...cartItems, ...guestItems];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto px-3 pb-4 pt-1 max-w-5xl">
        <div className="flex flex-col lg:flex-row items-start gap-4 mt-2">
          <div className="w-full lg:w-3/5 order-1">
            <ShippingInformationCard />
          </div>
          <div className="w-full lg:w-2/5 order-2 lg:sticky lg:top-20">
            <OrderSummeryCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutClinet;
