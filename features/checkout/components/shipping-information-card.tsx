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
import { CheckCircle2, ChevronRight, CreditCard, Wallet, Lock, User, Calendar, Zap } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useCartStore } from "@/features/cart/state/use-cart-store";
import { useSettings } from "@/features/settings/api/use-settings";
import { useCurrency } from "@/hooks/use-currency";
import { useCurrent } from "@/features/auth/api/use-current";
import { UseCheckout } from "../api/use-checkout";
import { useLanguage } from "@/hooks/use-language";

function ShippingInformationCard() {
  const setShipping = useCartStore((state) => state.setShipping);
  const { data: settings } = useSettings();
  const { formatAmount } = useCurrency();
  const { data: currentUser } = useCurrent();
  const { mutate, isPending } = UseCheckout();
  const { t } = useLanguage();

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
      fullName: currentUser?.name ?? "",
      phone: currentUser?.phone ?? "",
      email: currentUser?.email ?? "",
      address: currentUser?.address ?? "",
      shippingZone: "" as any,
      paymentMethod: defaultMethod,
      cardNumber: "",
      cvv: "",
      expirationDate: "",
      nameOnCard: "",
    },
  });

  const selectedZone = form.watch("shippingZone");
  const selectedPaymentMethod = form.watch("paymentMethod");

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.name && !form.getValues("fullName")) form.setValue("fullName", currentUser.name);
    if (currentUser.email && !form.getValues("email")) form.setValue("email", currentUser.email);
    if (currentUser.phone && !form.getValues("phone")) form.setValue("phone", currentUser.phone);
    if (currentUser.address && !form.getValues("address")) form.setValue("address", currentUser.address);
  }, [currentUser, form]);

  useEffect(() => {
    if (selectedZone && zoneCosts[selectedZone] !== undefined) {
      setShipping(zoneCosts[selectedZone]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone, zoneCosts.inside_dhaka, zoneCosts.outside_dhaka]);

  const onSubmit = (values: DeliveryAndPaymentFormValues) => {
    const basePaymentInfo = { paymentMethod: values.paymentMethod };
    const paymentPayload =
      values.paymentMethod === "cod"
        ? basePaymentInfo
        : {
            ...basePaymentInfo,
            cardNumber: values.cardNumber,
            expirationDate: values.expirationDate,
            cvv: values.cvv,
            nameOnCard: values.nameOnCard,
          };

    mutate({
      shippingInfo: {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        address: values.address,
        shippingZone: values.shippingZone,
        notes: values.notes,
      },
      paymentMethod: values.paymentMethod,
      paymentInfo: paymentPayload,
    });
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
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">{t("deliveryTitle")}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{t("deliveryDesc")}</p>
            </CardHeader>
            <CardContent className="p-0 w-full space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField name="fullName" control={form.control} render={({ field }) => (
                  <FormItem className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("fullNameLabel")} *</label>
                    <FormControl>
                      <Input type="text" placeholder={t("fullNamePlaceholder")} className="h-10 bg-muted/30 border-transparent rounded-xl px-3 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="phone" control={form.control} render={({ field }) => (
                  <FormItem className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("phoneLabel")} *</label>
                    <FormControl>
                      <Input type="tel" placeholder={t("phonePlaceholder")} className="h-10 bg-muted/30 border-transparent rounded-xl px-3 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField name="address" control={form.control} render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("addressLabel")} *</label>
                  <FormControl>
                    <Textarea placeholder={t("addressPlaceholder")} rows={2} className="bg-muted/30 border-transparent rounded-xl resize-none py-2 px-3 text-sm min-h-[50px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="notes" control={form.control} render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("notesLabel")}
                  </label>
                  <FormControl>
                    <Textarea placeholder={t("notesPlaceholder")} rows={1} className="bg-muted/30 border-transparent rounded-xl resize-none py-2 px-3 text-sm min-h-[40px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="shippingZone" control={form.control} render={({ field }) => {
                const zoneError = form.formState.errors.shippingZone;
                const hasError = !!zoneError;
                return (
                  <FormItem className="pt-1 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("deliveryZoneLabel")} *</label>
                    <FormControl>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
                        {(Object.entries(SHIPPING_ZONES) as [ShippingZone, { label: string; cost: number }][]).map(
                          ([key, { label }]) => {
                            const zoneLabels: Record<string, string> = {
                              inside_dhaka: t("insideDhaka"),
                              outside_dhaka: t("outsideDhaka"),
                            };
                            const isSelected = field.value === key;
                            return (
                              <label key={key} htmlFor={key}
                                className={`relative flex items-center justify-between rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 select-none ${
                                  isSelected
                                    ? "border-foreground bg-foreground/5 shadow-[0_0_0_1px_rgba(0,0,0,0.08)] scale-[1.02]"
                                    : hasError
                                      ? "border-red-500 bg-red-500/5 hover:border-red-400 active:scale-[0.98]"
                                      : "border-border/60 bg-background hover:border-foreground/40 hover:bg-muted/30 hover:shadow-md active:scale-[0.98]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                    isSelected ? "border-foreground bg-foreground" : "border-muted-foreground/40"
                                  }`}>
                                    {isSelected && <div className="h-2 w-2 rounded-full bg-background" />}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-sm text-foreground">{zoneLabels[key] || label}</span>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{formatAmount(zoneCosts[key])}</p>
                                  </div>
                                </div>
                                <RadioGroupItem value={key} id={key} className="sr-only" />
                              </label>
                            );
                          }
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }} />
            </CardContent>
          </Card>

          {paymentMethodsCount > 1 && (
            <Card className="bg-background border border-border/40 rounded-2xl p-4 sm:p-6 w-full ring-0 shadow-sm">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg sm:text-xl font-bold text-foreground">{t("paymentTitle")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{t("paymentDesc")}</p>
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
                              <span className="font-bold text-xs sm:text-sm">{t("cardPayment")}</span>
                            </div>
                            <RadioGroupItem value="card" className={selectedPaymentMethod === "card" ? "border-foreground text-foreground" : "opacity-50"} />
                          </Label>
                          {selectedPaymentMethod === "card" && (
                            <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                              <FormField name="cardNumber" control={form.control} render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("cardNumberLabel")}</label>
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
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("cardholderNameLabel")}</label>
                                  <FormControl>
                                    <div className="relative">
                                      <Input placeholder={t("fullNamePlaceholder")} className="h-10 bg-background border border-border/40 rounded-xl px-3 pl-9 text-sm" {...field} />
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <div className="grid grid-cols-2 gap-3">
                                <FormField name="expirationDate" control={form.control} render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("expiryLabel")}</label>
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
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("cvvLabel")}</label>
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
                              <span className="font-bold text-xs sm:text-sm">{t("cashOnDelivery")}</span>
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
            <Button
              type="submit"
              disabled={isPending}
              id="checkout-purchase-button"
              data-pixel-event="purchase"
              data-testid="checkout-purchase-button"
              className="w-full h-12 lg:h-14 rounded-full text-sm lg:text-base font-semibold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" fill="currentColor" />
                  {selectedPaymentMethod === "cod" ? t("placeOrder") : t("confirmAndPay")}
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ShippingInformationCard;
