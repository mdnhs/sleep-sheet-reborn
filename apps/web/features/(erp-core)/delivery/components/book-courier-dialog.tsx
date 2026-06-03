"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBookCourier } from "../api/use-steadfast";
import { useCurrency } from "@/hooks/use-currency";
import type { Order } from "@/features/(erp-core)/orders/types";
import { Loader2, Truck } from "lucide-react";

interface BookCourierDialogProps {
  order: Order & { shippingMethod?: { name: string; duration: string } | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookCourierDialog({
  order,
  open,
  onOpenChange,
}: BookCourierDialogProps) {
  const [phone, setPhone] = useState(
    (order.user?.phone ?? order.guestPhone ?? "").replace(/\D/g, "").slice(0, 11)
  );
  const [note, setNote] = useState("");
  const { mutate, isPending } = useBookCourier();
  const { formatAmount } = useCurrency();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { orderId: order.id, recipient_phone: phone, note: note || undefined },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const address = [
    order.shippingAddress,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Book Steadfast Courier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground">Order #</p>
              <p className="font-mono font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">COD Amount</p>
              <p className="font-semibold">
                {order.paymentMethod === "COD"
                  ? formatAmount(order.totalAmount)
                  : "Non-COD (0)"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Recipient</p>
              <p className="font-medium">{order.user?.name ?? order.guestName ?? "Guest"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment</p>
              <Badge variant="outline">{order.paymentMethod}</Badge>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Delivery Address</p>
            <p className="font-medium">{address}</p>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Recipient Phone{" "}
              <span className="text-muted-foreground text-xs">(11 digits)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              maxLength={11}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">
              Note{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="note"
              placeholder="Delivery instructions…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || phone.length !== 11}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Book Courier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
