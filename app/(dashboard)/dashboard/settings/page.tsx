"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSettings, useUpdateSettings } from "@/features/settings/api/use-settings";
import { SUPPORTED_CURRENCIES } from "@/hooks/use-currency";
import { Loader2, Settings } from "lucide-react";

const shippingSchema = z.object({
  shipping_inside_dhaka: z.number({ error: "Must be a number" }).min(0, "Must be ≥ 0"),
  shipping_outside_dhaka: z.number({ error: "Must be a number" }).min(0, "Must be ≥ 0"),
});

const currencySchema = z.object({
  currency: z.string().min(1),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;
type CurrencyFormValues = z.infer<typeof currencySchema>;

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const { mutate, isPending } = useUpdateSettings();

  const shippingForm = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      shipping_inside_dhaka: 60,
      shipping_outside_dhaka: 120,
    },
  });

  const currencyForm = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: { currency: "BDT" },
  });

  const cardEnabled = data ? data.payment_method_card !== "false" : true;
  const codEnabled = data ? data.payment_method_cod !== "false" : true;

  useEffect(() => {
    if (data) {
      shippingForm.reset({
        shipping_inside_dhaka: Number(data.shipping_inside_dhaka ?? 60),
        shipping_outside_dhaka: Number(data.shipping_outside_dhaka ?? 120),
      });
      currencyForm.reset({
        currency: data.currency ?? "BDT",
      });
    }
  }, [data, shippingForm, currencyForm]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <p className="text-sm text-muted-foreground">
            Applied across all prices, orders, and receipts
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Form {...currencyForm}>
              <form
                onSubmit={currencyForm.handleSubmit((values) => mutate(values))}
                className="space-y-4"
              >
                <FormField
                  name="currency"
                  control={currencyForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-semibold">Store Currency</label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map(({ code, label }) => (
                            <SelectItem key={code} value={code}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Currency
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enable or disable payment options at checkout
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Credit / Debit Card</span>
                  <span className="text-xs text-muted-foreground">Online card payments</span>
                </div>
                <Switch
                  checked={cardEnabled}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    mutate({ payment_method_card: checked ? "true" : "false" })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Cash on Delivery</span>
                  <span className="text-xs text-muted-foreground">Pay when order arrives</span>
                </div>
                <Switch
                  checked={codEnabled}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    mutate({ payment_method_cod: checked ? "true" : "false" })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Costs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Charge applied at checkout based on delivery zone
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...shippingForm}>
              <form
                onSubmit={shippingForm.handleSubmit((values) => mutate(values))}
                className="space-y-4"
              >
                <FormField
                  name="shipping_inside_dhaka"
                  control={shippingForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-semibold">Inside Dhaka</label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="shipping_outside_dhaka"
                  control={shippingForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-semibold">Outside Dhaka</label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Shipping
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
