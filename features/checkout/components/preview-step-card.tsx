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
    <div className="w-full lg:w-[55%]">
      <Card className="bg-background border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 w-full ring-0">
        <CardHeader className="p-0 mb-6 flex flex-col items-start">
          <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Review Order</CardTitle>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">Please double check your details before placing the order.</p>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <div className="space-y-4 p-6 bg-secondary/10 border border-border/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                <MapPin className="h-5 w-5 text-foreground" />
              </div>
              <h2 className="text-lg font-bold">Delivery Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pl-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{shippingInfo?.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{shippingInfo?.phone}</p>
              </div>
              {shippingInfo?.email && (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{shippingInfo.email}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Delivery Address</p>
                <p className="font-medium leading-relaxed">{shippingInfo?.address}</p>
              </div>
            </div>
          </div>

          {/* Payment Method Summary */}
          {paymentMethod === "card" && paymentInfo && (
            <div className="bg-muted/30 border border-border/40 rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-background" />
                </div>
                <h3 className="font-bold text-lg">Payment Method</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pt-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Card Holder</p>
                  <p className="font-medium">{paymentInfo.nameOnCard}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Card Number</p>
                  <p className="font-medium">•••• {paymentInfo.cardNumber?.slice(-4)}</p>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "cod" && (
            <div className="space-y-4 p-6 bg-secondary/10 border border-border/50 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm">
                  <Wallet className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1">Cash on Delivery</h2>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pay in cash when your order arrives.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isPending}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground font-semibold hover:bg-muted/50 rounded-full h-12 px-6"
            >
              Edit Details
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isPending}
              className="w-full sm:w-auto h-14 px-10 rounded-full font-bold text-base md:text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 bg-foreground text-background"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
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
