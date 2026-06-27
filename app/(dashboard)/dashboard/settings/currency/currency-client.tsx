"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyForm } from "@/features/settings/components/currency-form";
import { DollarSign } from "lucide-react";

export function CurrencySettings() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Currency</h1>
          <p className="text-sm text-muted-foreground">
            Applied across all prices, orders, and receipts
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Store Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyForm />
        </CardContent>
      </Card>
    </div>
  );
}
