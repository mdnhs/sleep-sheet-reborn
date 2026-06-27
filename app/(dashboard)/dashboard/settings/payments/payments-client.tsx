"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsForm } from "@/features/settings/components/payments-form";
import { PosPaymentMethods } from "@/features/settings/components/pos-payment-methods";
import { CreditCard, Store } from "lucide-react";

export function PaymentsSettings() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">
            Enable or disable payment options at checkout
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Checkout Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentsForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle>POS Payment Methods</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Cash is always available. Toggle Card and Due on/off. Add custom methods like BKash, Nagad, etc.
          </p>
        </CardHeader>
        <CardContent>
          <PosPaymentMethods />
        </CardContent>
      </Card>
    </div>
  );
}
