"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsForm } from "@/features/settings/components/payments-form";
import { CreditCard } from "lucide-react";

export function PaymentsSettings() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
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
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentsForm />
        </CardContent>
      </Card>
    </div>
  );
}
