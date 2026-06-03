"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product: { name: string; images: string[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  guestName?: string | null;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-600 bg-yellow-50" },
  PROCESSING: { label: "Processing", color: "text-blue-600 bg-blue-50" },
  SHIPPED: { label: "Shipped", color: "text-purple-600 bg-purple-50" },
  DELIVERED: { label: "Delivered", color: "text-green-600 bg-green-50" },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50" },
};

export default function TrackOrderPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const { formatAmount } = useCurrency();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError("");
    setSearched(false);

    try {
      const res = await fetch(`/api/orders/by-phone?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch orders");
        setOrders([]);
      } else {
        setOrders(data.orders || []);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">
          Enter the phone number you used when placing your order
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <Input
          type="tel"
          placeholder="01XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? (
            "Searching..."
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </form>

      {error && (
        <p className="text-destructive text-center mb-4">{error}</p>
      )}

      {searched && !error && orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No orders found for this phone number.</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: "" };
          return (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product.name}
                      {item.size && <span className="text-muted-foreground"> ({item.size})</span>}
                      {" "}× {item.quantity}
                    </span>
                    <span className="font-medium">{formatAmount(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Card Payment"}
                </span>
                <span className="font-semibold">{formatAmount(order.totalAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
