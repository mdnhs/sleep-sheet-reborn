"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconPackages,
  IconStack2,
  IconAlertTriangle,
  IconCircleOff,
  IconClockExclamation,
  IconTrash,
} from "@tabler/icons-react";
import { useInventorySummary } from "@/features/inventory/api/use-inventory-queries";

const cards = [
  { key: "totalSkus", label: "Total Products", icon: IconPackages, tone: "text-foreground" },
  { key: "totalUnits", label: "Units in Stock", icon: IconStack2, tone: "text-foreground" },
  { key: "lowStockCount", label: "Low Stock", icon: IconAlertTriangle, tone: "text-amber-600" },
  { key: "outOfStockCount", label: "Out of Stock", icon: IconCircleOff, tone: "text-destructive" },
  { key: "expiringSoonCount", label: "Expiring ≤30d", icon: IconClockExclamation, tone: "text-orange-600" },
  { key: "damageLossThisMonth", label: "Damage/Loss (mo)", icon: IconTrash, tone: "text-destructive" },
] as const;

export function InventoryOverview() {
  const { data, isLoading } = useInventorySummary();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ key, label, icon: Icon, tone }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className={`size-5 ${tone}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={`text-2xl font-bold ${tone}`}>{data?.[key] ?? 0}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
