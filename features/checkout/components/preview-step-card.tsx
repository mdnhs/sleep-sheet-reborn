"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React from "react";
import {
  CreditCard,
  User,
  MapPin,
  Mail,
  Phone,
  Lock,
  ChevronLeft,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { setStep } from "../state/checkoutSlice";
import { Button } from "@/components/ui/button";
import { UseCheckout } from "../api/use-checkout";
import { toast } from "sonner";

function PreviewStepCard() {
  const shippingInfo = useAppSelector((state) => state.checkout.shippingInfo);
  const paymentInfo = useAppSelector((state) => state.checkout.paymentInfo);
  const paymentMethod = useAppSelector((state) => state.checkout.paymentMethod);
  const dispatch = useAppDispatch();

  const { mutate, isPending } = UseCheckout();

  const handleBack = () => {
    dispatch(setStep("initial"));
  };

  const handleCheckout = async () => {
    if (!shippingInfo || !paymentMethod) {
      toast.error("Please complete all checkout steps before placing the order.");
      return;
    }
    const basePaymentInfo = { paymentMethod };
    const paymentPayload =
      paymentMethod === "cod"
        ? basePaymentInfo
        : {
            ...basePaymentInfo,
            cardNumber: paymentInfo?.cardNumber,
            expirationDate: paymentInfo?.expirationDate,
            cvv: paymentInfo?.cvv,
            nameOnCard: paymentInfo?.nameOnCard,
          };
    mutate({
      shippingInfo,
      paymentMethod,
      paymentInfo: paymentPayload,
    });
  };

  return (
    <div className="w-full">
      <Card className="bg-background border border-border/40 rounded-2xl p-4 sm:p-6 w-full ring-0 shadow-sm">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Review Order</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Please double check your details before placing the order.</p>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="p-4 bg-secondary/10 border border-border/50 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                <MapPin className="h-4 w-4 text-foreground" />
              </div>
              <h2 className="text-sm font-bold">Delivery Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{shippingInfo?.fullName}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{shippingInfo?.phone}</p>
              </div>
              {shippingInfo?.email && (
                <div className="sm:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{shippingInfo.email}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Address</p>
                <p className="text-sm font-medium leading-relaxed">{shippingInfo?.address}</p>
              </div>
              {shippingInfo?.notes && (
                <div className="sm:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Notes</p>
                  <p className="text-sm font-medium">{shippingInfo.notes}</p>
                </div>
              )}
            </div>
          </div>

          {paymentMethod === "card" && paymentInfo && (
            <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
                <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-background" />
                </div>
                <h3 className="font-bold text-sm">Payment Method</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Card Holder</p>
                  <p className="text-sm font-medium">{paymentInfo.nameOnCard}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Card Number</p>
                  <p className="text-sm font-medium">•••• {paymentInfo.cardNumber?.slice(-4)}</p>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "cod" && (
            <div className="flex items-center gap-3 p-4 bg-secondary/10 border border-border/50 rounded-2xl">
              <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm shrink-0">
                <Wallet className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Cash on Delivery</h2>
                <p className="text-xs text-muted-foreground">Pay in cash when your order arrives.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button variant="ghost" onClick={handleBack} disabled={isPending}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground font-semibold rounded-full h-10 px-5 text-sm"
            >
              Edit Details
            </Button>
            <Button onClick={handleCheckout} disabled={isPending}
              className="w-full sm:w-auto h-11 px-8 rounded-full font-bold text-sm shadow-md bg-foreground text-background"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {paymentMethod === "cod" ? "Place Order" : "Confirm & Pay"}
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PreviewStepCard;
