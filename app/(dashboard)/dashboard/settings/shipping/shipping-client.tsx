"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShippingForm } from "@/features/settings/components/shipping-form";
import { CourierForm } from "@/features/settings/components/courier-form";
import { Truck } from "lucide-react";

export function ShippingSettings() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Truck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Shipping & Courier</h1>
          <p className="text-sm text-muted-foreground">
            Configure shipping costs and courier API credentials
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <ShippingForm />
          </CardContent>
        </Card>
        <CourierForm />
      </div>
    </div>
  );
}
