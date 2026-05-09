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
            expirationDate: paymentInfo?.expiry,
            cvv: paymentInfo?.cvc,
            nameOnCard: paymentInfo?.nameOnCard,
          };
    mutate({
      shippingInfo,
      paymentMethod,
      paymentInfo: paymentPayload,
    });
  };

  return (
    <div className="w-full lg:w-[60%]">
      <Card className="bg-background shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="bg-muted p-2 rounded-full">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Order Preview</h1>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h2 className="text-xl font-semibold">Delivery Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <p><span className="font-medium">Name:</span> {shippingInfo?.fullName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p><span className="font-medium">Phone:</span> {shippingInfo?.phone}</p>
              </div>
              {shippingInfo?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p><span className="font-medium">Email:</span> {shippingInfo.email}</p>
                </div>
              )}
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p><span className="font-medium">Address:</span> {shippingInfo?.address}</p>
              </div>
            </div>
          </div>

          {paymentMethod === "card" && paymentInfo && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Payment Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p><span className="font-medium">Card Holder:</span> {paymentInfo.nameOnCard}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <p><span className="font-medium">Card Number:</span> •••• •••• •••• {paymentInfo.cardNumber?.slice(-4)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Expiry:</span> {paymentInfo.expiry}
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Securely encrypted</p>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "cod" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Payment Method</h2>
              </div>
              <div className="flex items-center gap-4 p-3">
                <div className="flex-1">
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll pay in cash when your order arrives
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-row justify-between mt-4">
        <Button variant="ghost" onClick={handleBack}>
          <ChevronLeft />
          Back to Payment
        </Button>
        <Button onClick={handleCheckout} disabled={isPending}>
          {isPending ? "Placing Order..." : paymentMethod === "cod" ? "Place Order (COD)" : "Confirm & Pay"}
        </Button>
      </div>
    </div>
  );
}

export default PreviewStepCard;
