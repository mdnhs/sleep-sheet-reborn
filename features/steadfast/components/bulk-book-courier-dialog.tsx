import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Order } from "@/features/order/types";
import { Loader2 } from "lucide-react";

type ShippingOrder = Order & {
  shippingMethod?: { name: string; duration: string } | null;
};

interface BulkBookCourierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: ShippingOrder[];
  onConfirm: (costPrices: { orderItemId: string; costPrice: number }[]) => void;
  isBooking: boolean;
}

export function BulkBookCourierDialog({
  open,
  onOpenChange,
  orders,
  onConfirm,
  isBooking
}: BulkBookCourierDialogProps) {
  const [costPricesMap, setCostPricesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initialMap: Record<string, string> = {};
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (item.costPrice !== null && item.costPrice !== undefined) {
            initialMap[item.id] = item.costPrice.toString();
          }
        });
      });
      setCostPricesMap(initialMap);
    }
  }, [open, orders]);

  const handleConfirm = () => {
    const payload = Object.entries(costPricesMap)
      .filter(([_, priceStr]) => priceStr.trim() !== "" && !isNaN(Number(priceStr)))
      .map(([id, priceStr]) => ({
        orderItemId: id,
        costPrice: Number(priceStr)
      }));
    
    onConfirm(payload);
  };

  const handlePriceChange = (id: string, value: string) => {
    setCostPricesMap(prev => ({ ...prev, [id]: value }));
  };

  const itemsCount = orders.reduce((acc, order) => acc + (order.items?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Booking: Bought Prices</DialogTitle>
          <DialogDescription>
            You are about to book {orders.length} orders containing {itemsCount} items.
            Please verify or enter the bought prices (cost prices) for the items below to accurately calculate your profit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 -mx-4 px-4 overflow-y-auto">
          <div className="space-y-6 pb-4">
            {orders.map(order => (
              <div key={order.id} className="space-y-3 border rounded-xl p-4 bg-muted/20">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h4 className="font-semibold">{order.orderNumber}</h4>
                    <p className="text-xs text-muted-foreground">{order.guestName || order.user?.name || "Customer"}</p>
                  </div>
                  <span className="text-sm font-medium">৳{order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="space-y-3">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 bg-muted rounded-md overflow-hidden">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-slate-100 dark:bg-slate-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product?.name || "Unknown Product"}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="w-28 shrink-0">
                        {item.costPrice !== null && item.costPrice !== undefined ? (
                          <div className="flex h-8 w-full items-center justify-end px-3 text-sm font-medium text-muted-foreground border rounded-md bg-muted/50">
                            ৳{item.costPrice}
                          </div>
                        ) : (
                          <Input
                            type="number"
                            placeholder="Bought Price"
                            className="h-8 text-sm"
                            value={costPricesMap[item.id] || ""}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBooking}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isBooking} className="gap-2">
            {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isBooking ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
