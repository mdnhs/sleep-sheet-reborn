"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { useCurrency } from "@/hooks/use-currency";
import Image from "next/image";
import React, { useEffect, useState } from "react";

function OrderSummeryCard() {
  const userItems = useAppSelector((state) => state.cart.items);
  const guestItems = useAppSelector((state) => state.cart.guestItems);
  const cartItems = [...userItems, ...guestItems];
  const shippingCost = useAppSelector((state) => state.cart.shipping);
  const { symbol, formatAmount } = useCurrency();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = shippingCost;
  const total = subtotal + shipping;

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  if (!hasMounted) return null;

  return (
    <Card className="w-full lg:w-[40%] min-h-[300px] h-auto lg:sticky lg:top-24 bg-background border border-border/40 ring-0 py-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden">
      <CardHeader className="bg-transparent pt-8 pb-6 px-8 border-b border-border/40">
        <CardTitle className="flex items-center gap-2">
          <p className="text-2xl font-bold tracking-tight">Order Summary</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8 pt-8">
        {hasMounted &&
          cartItems?.map((cartItem) => (
            <div key={cartItem.id} className="flex flex-row gap-5 group items-center">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted/20 relative">
                <Image
                  src={cartItem?.image}
                  alt={cartItem?.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="flex flex-col justify-center w-full">
                <div className="flex flex-row justify-between gap-4 items-start mb-1">
                  <h1 className="text-sm font-semibold leading-tight pr-4">{cartItem.name}</h1>
                  <label className="font-bold text-sm whitespace-nowrap">{symbol}{cartItem.price}</label>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Qty: {cartItem.quantity}</span>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span>Variant: {cartItem.color}</span>
                  {cartItem.size && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border"></span>
                      <span>Size: {cartItem.size}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

        <div className="border-t border-border/40 pt-6 space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground/80">Subtotal</span>
              <span className="font-semibold text-foreground">{formatAmount(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground/80">Shipping</span>
              <span className="font-semibold text-foreground">{shipping > 0 ? formatAmount(shipping) : "Calculated next"}</span>
            </div>
            <div className="flex justify-between items-end pt-5 border-t border-border/40 mt-6">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="text-3xl font-black text-foreground tracking-tight">{formatAmount(total)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderSummeryCard;
