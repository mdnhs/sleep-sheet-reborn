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
  const paymentMethodsCount = [cardEnabled, codEnabled].filter(Boolean).length;
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
      notes: values.notes,
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
    <div className="w-full">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="bg-background border border-border/40 rounded-2xl p-4 sm:p-6 w-full ring-0 shadow-sm">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Delivery</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Tell us where to send your order.</p>
            </CardHeader>
            <CardContent className="p-0 w-full space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField name="fullName" control={form.control} render={({ field }) => (
                  <FormItem className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <FormControl>
                      <Input type="text" placeholder="John Doe" className="h-10 bg-muted/30 border-transparent rounded-xl px-3 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="phone" control={form.control} render={({ field }) => (
                  <FormItem className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</label>
                    <FormControl>
                      <Input type="tel" placeholder="01XXXXXXXXX" className="h-10 bg-muted/30 border-transparent rounded-xl px-3 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Email <span className="text-muted-foreground/40 lowercase font-normal tracking-normal">(optional)</span>
                  </label>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" className="h-10 bg-muted/30 border-transparent rounded-xl px-3 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="address" control={form.control} render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Address</label>
                  <FormControl>
                    <Textarea placeholder="House/Flat, Road, Area, District, City" rows={2} className="bg-muted/30 border-transparent rounded-xl resize-none py-2 px-3 text-sm min-h-[50px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="notes" control={form.control} render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Order Notes <span className="text-muted-foreground/40 lowercase font-normal tracking-normal">(optional)</span>
                  </label>
                  <FormControl>
                    <Textarea placeholder="Special instructions..." rows={1} className="bg-muted/30 border-transparent rounded-xl resize-none py-2 px-3 text-sm min-h-[40px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="shippingZone" control={form.control} render={({ field }) => (
                <FormItem className="pt-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Zone</label>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                      {(Object.entries(SHIPPING_ZONES) as [ShippingZone, { label: string; cost: number }][]).map(
                        ([key, { label }]) => (
                          <label key={key} htmlFor={key}
                            className={`relative flex items-center justify-between rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 ${
                              field.value === key ? "border-foreground bg-secondary/10" : "border-transparent bg-secondary/10"
                            }`}
                          >
                            <div>
                              <span className="font-semibold text-xs text-foreground">{label}</span>
                              <p className="text-[10px] text-muted-foreground/80 font-medium">{formatAmount(zoneCosts[key])}</p>
                            </div>
                            <RadioGroupItem value={key} id={key} className={field.value === key ? "border-foreground text-foreground" : "opacity-40"} />
                          </label>
                        )
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {paymentMethodsCount > 1 && (
            <Card className="bg-background border border-border/40 rounded-2xl p-4 sm:p-6 w-full ring-0 shadow-sm">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Payment</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">All transactions are secure and encrypted.</p>
              </CardHeader>
              <CardContent className="p-0">
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-2">
                      {cardEnabled && (
                        <div className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${selectedPaymentMethod === "card" ? "border-foreground bg-muted/20" : "border-border/40"}`}>
                          <Label className="flex items-center justify-between p-3 cursor-pointer w-full m-0">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${selectedPaymentMethod === "card" ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                                <CreditCard className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-bold text-xs sm:text-sm">Credit / Debit Card</span>
                            </div>
                            <RadioGroupItem value="card" className={selectedPaymentMethod === "card" ? "border-foreground text-foreground" : "opacity-50"} />
                          </Label>
                          {selectedPaymentMethod === "card" && (
                            <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                              <FormField name="cardNumber" control={form.control} render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Card Number</label>
                                  <FormControl>
                                    <div className="relative">
                                      <Input placeholder="0000 0000 0000 0000" className="h-10 bg-background border border-border/40 rounded-xl px-3 pl-9 text-sm font-mono tracking-widest" {...field} />
                                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField name="nameOnCard" control={form.control} render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cardholder Name</label>
                                  <FormControl>
                                    <div className="relative">
                                      <Input placeholder="John Doe" className="h-10 bg-background border border-border/40 rounded-xl px-3 pl-9 text-sm" {...field} />
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <div className="grid grid-cols-2 gap-3">
                                <FormField name="expirationDate" control={form.control} render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expiry</label>
                                    <FormControl>
                                      <div className="relative">
                                        <Input placeholder="MM/YY" className="h-10 bg-background border border-border/40 rounded-xl px-3 pl-9 text-sm font-mono tracking-widest" {...field} />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField name="cvv" control={form.control} render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CVV</label>
                                    <FormControl>
                                      <div className="relative">
                                        <Input placeholder="123" className="h-10 bg-background border border-border/40 rounded-xl px-3 pl-9 text-sm font-mono tracking-widest" {...field} />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {codEnabled && (
                        <div className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${selectedPaymentMethod === "cod" ? "border-foreground bg-muted/20" : "border-border/40"}`}>
                          <Label className="flex items-center justify-between p-3 cursor-pointer w-full m-0">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${selectedPaymentMethod === "cod" ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                                <Wallet className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-bold text-xs sm:text-sm">Cash on Delivery</span>
                            </div>
                            <RadioGroupItem value="cod" className={selectedPaymentMethod === "cod" ? "border-foreground text-foreground" : "opacity-50"} />
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" className="w-full h-11 rounded-full font-bold text-sm shadow-md bg-foreground text-background">
              Continue to Review
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ShippingInformationCard;
