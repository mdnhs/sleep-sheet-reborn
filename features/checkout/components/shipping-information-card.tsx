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
import { CreditCard, Wallet } from "lucide-react";
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
    <div className="p-0 w-full lg:w-[60%]">
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Delivery Information */}
          <Card className="bg-transparent border-0 shadow-none w-full px-5">
            <CardHeader className="p-0">
              <CardTitle className="text-2xl font-semibold">Delivery Information</CardTitle>
              <p className="text-sm text-muted-foreground">No account needed — just fill in your details</p>
            </CardHeader>
            <CardContent className="p-0 w-full space-y-4 mt-4">
              <FormField
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-semibold">Full Name</label>
                    <FormControl>
                      <Input type="text" placeholder="Your full name" {...field} />
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
                    <label className="text-sm font-semibold">Phone Number</label>
                    <FormControl>
                      <Input type="tel" placeholder="01XXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-semibold">
                      Email <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
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
                    <label className="text-sm font-semibold">Full Address</label>
                    <FormControl>
                      <Textarea placeholder="House/Flat, Road, Area, District, City" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="shippingZone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-semibold">Delivery Zone</label>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 gap-3 mt-1"
                      >
                        {(Object.entries(SHIPPING_ZONES) as [ShippingZone, { label: string; cost: number }][]).map(
                          ([key, { label }]) => (
                            <label
                              key={key}
                              htmlFor={key}
                              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-colors ${
                                field.value === key
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <RadioGroupItem value={key} id={key} />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">{formatAmount(zoneCosts[key])}</span>
                              </div>
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
          <Card className="bg-transparent border-0 shadow-none w-full px-5">
            <CardHeader className="p-0">
              <CardTitle className="text-2xl font-semibold">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4">
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
                        <div className="border p-4 rounded-md">
                          <Label className="flex items-center gap-3 cursor-pointer">
                            <RadioGroupItem value="card" />
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              <span className="font-semibold">Credit/Debit Card</span>
                            </div>
                          </Label>

                          {selectedPaymentMethod === "card" && (
                            <div className="mt-4 space-y-4">
                              <FormField
                                name="cardNumber"
                                control={form.control}
                                render={({ field }) => (
                                  <FormItem>
                                    <Label>Card Number</Label>
                                    <FormControl>
                                      <Input placeholder="1234 5678 9012 3456" {...field} />
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
                                    <Label>Cardholder Name</Label>
                                    <FormControl>
                                      <Input placeholder="John Smith" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex gap-4">
                                <FormField
                                  name="expirationDate"
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <Label>Expiration Date (MM/YY)</Label>
                                      <FormControl>
                                        <Input placeholder="MM/YY" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  name="cvv"
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <Label>CVV</Label>
                                      <FormControl>
                                        <Input placeholder="123" {...field} />
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
                        <div className="border p-4 rounded-md">
                          <Label className="flex items-center gap-3 cursor-pointer">
                            <RadioGroupItem value="cod" />
                            <div className="flex items-center gap-2">
                              <Wallet className="h-5 w-5" />
                              <span className="font-semibold">Cash on Delivery</span>
                            </div>
                          </Label>
                          {selectedPaymentMethod === "cod" && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Pay with cash when your order is delivered
                            </p>
                          )}
                        </div>
                      )}
                    </RadioGroup>
                  </FormItem>
                )}
              />
            </CardContent>

            <div className="flex justify-end mt-6">
              <Button type="submit" className="w-full md:w-[12rem]">
                Review Order
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default ShippingInformationCard;
