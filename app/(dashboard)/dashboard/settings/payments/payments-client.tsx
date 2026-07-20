"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsForm } from "@/features/settings/components/payments-form";
import { PosPaymentMethods } from "@/features/settings/components/pos-payment-methods";
import { CreditCard, Store } from "lucide-react";

export function PaymentsSettings() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
        <p className="text-muted-foreground text-sm">
          Enable or disable payment options at checkout and point of sale
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <h2 className="text-base font-bold tracking-tight">Checkout Payment Methods</h2>
          <PaymentsForm />
        </div>

        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
          <div>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              POS Payment Methods
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Cash is always available. Toggle Card and Due on/off. Add custom methods like BKash, Nagad, etc.
            </p>
          </div>
          <PosPaymentMethods />
        </div>
      </div>
    </div>
  );
}
