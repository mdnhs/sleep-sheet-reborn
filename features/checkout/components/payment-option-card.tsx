"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ChevronLeft, CreditCard, Wallet } from "lucide-react";
import React, { useEffect } from "react";
import { paymentInformationSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  setPaymentInfo,
  setPaymentMethod,
  setStep,
} from "../state/checkoutSlice";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/features/settings/api/use-settings";
import { z } from "zod";

function PaymentOptionCard() {
  const dispatch = useAppDispatch();
  const { paymentInfo, paymentMethod } = useAppSelector(
    (state) => state.checkout,
  );
  const { data: settings } = useSettings();
  const cardEnabled = settings ? settings.payment_method_card !== "false" : true;
  const codEnabled = settings ? settings.payment_method_cod !== "false" : true;

  const defaultMethod = cardEnabled ? "card" : codEnabled ? "cod" : "cod";

  const form = useForm<z.infer<typeof paymentInformationSchema>>({
    resolver: zodResolver(paymentInformationSchema),
    defaultValues: {
      paymentMethod: paymentMethod || defaultMethod,
      cardNumber: "",
      cvv: "",
      expirationDate: "",
      nameOnCard: "",
    },
  });

  const paymentMethodValue = form.watch("paymentMethod");

  const onSubmit = (values: z.infer<typeof paymentInformationSchema>) => {
    if (values.paymentMethod === "card") {
      dispatch(
        setPaymentInfo({
          cardNumber: values.cardNumber!,
          expiry: values.expirationDate!,
          cvc: values.cvv!,
          nameOnCard: values.nameOnCard!,
        }),
      );
    } else {
      dispatch(setPaymentInfo(null));
    }

    dispatch(setPaymentMethod(values.paymentMethod));
    dispatch(setStep("confirmation"));
  };

  useEffect(() => {
    if (paymentMethod === "cod") {
      form.reset({
        paymentMethod: "cod",
        cardNumber: "",
        cvv: "",
        expirationDate: "",
        nameOnCard: "",
      });
    } else if (paymentInfo) {
      form.reset({
        paymentMethod: "card",
        cardNumber: paymentInfo.cardNumber,
        cvv: paymentInfo.cvc,
        expirationDate: paymentInfo.expiry,
        nameOnCard: paymentInfo.nameOnCard,
      });
    }
  }, [paymentInfo, paymentMethod, form]);

  const handleBack = () => {
    dispatch(setStep("initial"));
  };

  return (
    <div className="p-0 w-full lg:w-[60%]">
      <Card className="bg-transparent border-0 shadow-none w-full px-5">
        <CardHeader className="p-0">
          <CardTitle>
            <p className="text-2xl font-bold">Payment Method</p>
          </CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="p-0 space-y-6">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    {!cardEnabled && !codEnabled && (
                      <p className="text-sm text-destructive">
                        No payment methods are currently available. Please contact support.
                      </p>
                    )}
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-4"
                    >
                      {cardEnabled && (
                        <div className="border p-4 rounded-md">
                          <Label className="flex items-center gap-3 cursor-pointer">
                            <RadioGroupItem value="card" />
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              <span className="font-semibold">
                                Credit/Debit Card
                              </span>
                            </div>
                          </Label>

                          {paymentMethodValue === "card" && (
                            <div className="mt-4 space-y-4">
                              <FormField
                                name="cardNumber"
                                control={form.control}
                                render={({ field }) => (
                                  <FormItem>
                                    <Label>Card Number</Label>
                                    <FormControl>
                                      <Input
                                        placeholder="1234 5678 9012 3456"
                                        {...field}
                                      />
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
                                      <Input
                                        placeholder="John Smith"
                                        {...field}
                                      />
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
                              <span className="font-semibold">
                                Cash on Delivery
                              </span>
                            </div>
                          </Label>
                          {paymentMethodValue === "cod" && (
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

            <div className="flex flex-row justify-between">
              <Button variant="ghost" type="button" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Delivery
              </Button>
              <Button type="submit">
                {paymentMethodValue === "cod"
                  ? "Confirm Cash on Delivery"
                  : "Continue to Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default PaymentOptionCard;
