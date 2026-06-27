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
    <Card className="w-full bg-background border border-border/40 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pt-4 pb-3 px-4 border-b border-border/40">
        <CardTitle className="flex items-center gap-2">
          <p className="text-base font-bold">Order Summary</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-3">
        {hasMounted &&
          cartItems?.map((cartItem) => (
            <div key={cartItem.id} className="flex gap-3 items-center">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/20 relative">
                <Image
                  src={cartItem?.image}
                  alt={cartItem?.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h1 className="text-xs font-semibold leading-tight truncate">{cartItem.name}</h1>
                  <label className="font-bold text-xs whitespace-nowrap">{symbol}{cartItem.price}</label>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-muted-foreground">
                  <span>Qty: {cartItem.quantity}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                  <span>{cartItem.color}</span>
                  {cartItem.size && (
                    <>
                      <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                      <span>{cartItem.size}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

        <div className="border-t border-border/40 pt-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground/80">Subtotal</span>
            <span className="font-semibold">{formatAmount(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground/80">Shipping</span>
            <span className="font-semibold">{shipping > 0 ? formatAmount(shipping) : "—"}</span>
          </div>
          <div className="flex justify-between items-end pt-2 border-t border-border/40">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
            <span className="text-xl font-black text-foreground tracking-tight">{formatAmount(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderSummeryCard;
