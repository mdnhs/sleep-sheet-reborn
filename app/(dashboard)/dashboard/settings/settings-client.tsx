"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign, CreditCard, Truck, Eye, ArrowRight } from "lucide-react";

const sections = [
  {
    title: "Currency",
    description: "Set store currency used across all prices, orders, and receipts",
    href: "/dashboard/settings/currency",
    icon: DollarSign,
  },
  {
    title: "Payment Methods",
    description: "Enable or disable payment options available at checkout",
    href: "/dashboard/settings/payments",
    icon: CreditCard,
  },
  {
    title: "Shipping Costs",
    description: "Configure delivery charges for different zones",
    href: "/dashboard/settings/shipping",
    icon: Truck,
  },
  {
    title: "Meta Pixel",
    description: "Manage Facebook Pixel tracking, page mappings, and debug mode",
    href: "/dashboard/settings/pixel",
    icon: Eye,
  },
];

export function SettingsOverview() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store configuration
          </p>
        </div>
      </div>
      <div className="grid gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 pb-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
