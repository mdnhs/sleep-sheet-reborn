"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InventoryOverview } from "@/features/inventory/components/inventory-overview";
import { StockTable } from "@/features/inventory/components/stock-table";
import { MovementsTable } from "@/features/inventory/components/movements-table";
import { LowStockAlert } from "@/features/inventory/components/low-stock-alert";
import { ExpiryTable } from "@/features/inventory/components/expiry-table";

export default function InventoryClient() {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Stock levels, movements, alerts and expiry.</p>
      </div>

      <InventoryOverview />

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <StockTable />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <MovementsTable />
        </TabsContent>
        <TabsContent value="low" className="mt-4">
          <LowStockAlert />
        </TabsContent>
        <TabsContent value="expiry" className="mt-4">
          <ExpiryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
