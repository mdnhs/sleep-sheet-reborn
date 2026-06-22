"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  DeliveryAndPaymentFormValues,
  deliveryAndPaymentSchema,
  SHIPPING_ZONES,
  ShippingZone,
} from "../schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronRight, CreditCard, Wallet, Lock, User, Calendar } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setShipping } from "@/features/cart/state/cart-slice";
import { setPaymentInfo, setPaymentMethod, setShippingInfo, setStep } from "../state/checkoutSlice";
import { useSettings } from "@/features/settings/api/use-settings";
import { useCurrency } from "@/hooks/use-currency";
import { useCurrent } from "@/features/auth/api/use-current";

function ShippingInformationCard() {
  const dispatch = useAppDispatch();
  const { shippingInfo, paymentInfo, paymentMethod } = useAppSelector((state) => state.checkout);
  const { data: settings } = useSettings();
  const { formatAmount } = useCurrency();
  const { data: currentUser } = useCurrent();

  const cardEnabled = settings ? settings.payment_method_card !== "false" : true;
  const codEnabled = settings ? settings.payment_method_cod !== "false" : true;
  const defaultMethod = cardEnabled ? "card" : "cod";

  const zoneCosts: Record<string, number> = {
    inside_dhaka: Number(settings?.shipping_inside_dhaka ?? SHIPPING_ZONES.inside_dhaka.cost),
    outside_dhaka: Number(settings?.shipping_outside_dhaka ?? SHIPPING_ZONES.outside_dhaka.cost),
  };

  const form = useForm<DeliveryAndPaymentFormValues>({
    resolver: zodResolver(deliveryAndPaymentSchema),
    defaultValues: {
      fullName: shippingInfo?.fullName ?? currentUser?.name ?? "",
      phone: shippingInfo?.phone ?? currentUser?.phone ?? "",
      email: shippingInfo?.email ?? currentUser?.email ?? "",
      address: shippingInfo?.address ?? currentUser?.address ?? "",
      shippingZone: shippingInfo?.shippingZone ?? "inside_dhaka",
      paymentMethod: paymentMethod ?? defaultMethod,
      cardNumber: paymentInfo?.cardNumber ?? "",
      cvv: paymentInfo?.cvc ?? "",
      expirationDate: paymentInfo?.expiry ?? "",
      nameOnCard: paymentInfo?.nameOnCard ?? "",
    },
  });

  const selectedZone = form.watch("shippingZone");
  const selectedPaymentMethod = form.watch("paymentMethod");

  useEffect(() => {
    if (!currentUser || shippingInfo) return;
    if (currentUser.name && !form.getValues("fullName")) form.setValue("fullName", currentUser.name);
    if (currentUser.email && !form.getValues("email")) form.setValue("email", currentUser.email);
    if (currentUser.phone && !form.getValues("phone")) form.setValue("phone", currentUser.phone);
    if (currentUser.address && !form.getValues("address")) form.setValue("address", currentUser.address);
  }, [currentUser, shippingInfo, form]);

  useEffect(() => {
    if (zoneCosts[selectedZone] !== undefined) {
      dispatch(setShipping(zoneCosts[selectedZone]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone, zoneCosts.inside_dhaka, zoneCosts.outside_dhaka]);

  const onSubmit = (values: DeliveryAndPaymentFormValues) => {
    dispatch(setShippingInfo({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      address: values.address,
      shippingZone: values.shippingZone,
    }));

    if (values.paymentMethod === "card") {
      dispatch(setPaymentInfo({
        cardNumber: values.cardNumber!,
        expiry: values.expirationDate!,
        cvc: values.cvv!,
        nameOnCard: values.nameOnCard!,
      }));
    } else {
      dispatch(setPaymentInfo(null));
    }

    dispatch(setPaymentMethod(values.paymentMethod));
    dispatch(setStep("confirmation"));
  };

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  if (!hasMounted) return null;

  return (
    <div className="p-0 w-full lg:w-[55%]">
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Delivery Information */}
          <Card className="bg-background border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 w-full ring-0">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Delivery</CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">Tell us where to send your order.</p>
            </CardHeader>
            <CardContent className="p-0 w-full space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  name="fullName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                      <FormControl>
                        <Input type="text" placeholder="John Doe" className="h-12 bg-muted/30 border-transparent focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="phone"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
                      <FormControl>
                        <Input type="tel" placeholder="01XXXXXXXXX" className="h-12 bg-muted/30 border-transparent focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Email <span className="text-muted-foreground/40 lowercase font-medium tracking-normal">(optional)</span>
                    </label>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" className="h-12 bg-muted/30 border-transparent focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="address"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Full Address</label>
                    <FormControl>
                      <Textarea placeholder="House/Flat, Road, Area, District, City" rows={2} className="bg-muted/30 border-transparent focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl resize-none py-3 px-4 min-h-[60px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="shippingZone"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="pt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Zone</label>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2"
                      >
                        {(Object.entries(SHIPPING_ZONES) as [ShippingZone, { label: string; cost: number }][]).map(
                          ([key, { label }]) => (
                            <label
                              key={key}
                              htmlFor={key}
                              className={`relative flex flex-col justify-center rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 ${
                                field.value === key
                                  ? "border-foreground bg-secondary/10 shadow-sm"
                                  : "border-transparent bg-secondary/10 hover:bg-secondary/20 hover:scale-[1.02]"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-0.5 gap-1">
                                <span className="font-semibold text-sm leading-tight text-foreground">{label}</span>
                                <RadioGroupItem value={key} id={key} className={field.value === key ? "border-foreground text-foreground" : "opacity-40"} />
                              </div>
                              <span className="text-xs text-muted-foreground/80 font-medium">{formatAmount(zoneCosts[key])}</span>
                            </label>
                          )
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="bg-background border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 w-full ring-0">
            <CardHeader className="p-0 mb-6 flex flex-col items-start">
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Payment</CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">All transactions are secure and encrypted.</p>
            </CardHeader>
            <CardContent className="p-0">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    {!cardEnabled && !codEnabled && (
                      <p className="text-sm text-destructive mb-2">
                        No payment methods are currently available. Please contact support.
                      </p>
                    )}
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-4">
                      {cardEnabled && (
                        <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${selectedPaymentMethod === "card" ? "border-foreground bg-muted/20 shadow-sm" : "border-border/40 bg-transparent hover:border-foreground/30 hover:bg-muted/10"}`}>
                          <Label className="flex items-center justify-between p-4 cursor-pointer w-full m-0">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${selectedPaymentMethod === "card" ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                                <CreditCard className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-sm md:text-base">Credit / Debit Card</span>
                            </div>
                            <RadioGroupItem value="card" className={selectedPaymentMethod === "card" ? "border-foreground text-foreground" : "opacity-50"} />
                          </Label>

                          {selectedPaymentMethod === "card" && (
                            <div className="px-5 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                              <FormField
                                name="cardNumber"
                                control={form.control}
                                render={({ field }) => (
                                  <FormItem>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Card Number</label>
                                    <FormControl>
                                      <div className="relative">
                                        <Input placeholder="0000 0000 0000 0000" className="h-12 bg-background border border-border/40 focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl px-4 pl-11 font-mono tracking-widest" {...field} />
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                name="nameOnCard"
                                control={form.control}
                                render={({ field }) => (
                                  <FormItem>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cardholder Name</label>
                                    <FormControl>
                                      <div className="relative">
                                        <Input placeholder="John Doe" className="h-12 bg-background border border-border/40 focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl px-4 pl-11" {...field} />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-5">
                                <FormField
                                  name="expirationDate"
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem>
                                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Expiry Date</label>
                                      <FormControl>
                                        <div className="relative">
                                          <Input placeholder="MM/YY" className="h-12 bg-background border border-border/40 focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl px-4 pl-11 font-mono tracking-widest" {...field} />
                                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  name="cvv"
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem>
                                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">CVV</label>
                                      <FormControl>
                                        <div className="relative">
                                          <Input placeholder="123" className="h-12 bg-background border border-border/40 focus-visible:ring-1 focus-visible:ring-foreground transition-all duration-300 rounded-xl px-4 pl-11 font-mono tracking-widest" {...field} />
                                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {codEnabled && (
                        <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${selectedPaymentMethod === "cod" ? "border-foreground bg-muted/20 shadow-sm" : "border-border/40 bg-transparent hover:border-foreground/30 hover:bg-muted/10"}`}>
                          <Label className="flex items-center justify-between p-4 cursor-pointer w-full m-0">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${selectedPaymentMethod === "cod" ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                                <Wallet className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-sm md:text-base">Cash on Delivery</span>
                            </div>
                            <RadioGroupItem value="cod" className={selectedPaymentMethod === "cod" ? "border-foreground text-foreground" : "opacity-50"} />
                          </Label>
                          {selectedPaymentMethod === "cod" && (
                            <div className="px-5 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                              <p className="text-sm font-medium text-muted-foreground">
                                You can pay in cash when your order is delivered to your address.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </RadioGroup>
                  </FormItem>
                )}
              />
            </CardContent>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="w-full md:w-auto h-14 px-12 rounded-full font-bold text-base md:text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 bg-foreground text-background">
                Continue to Review
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default ShippingInformationCard;
