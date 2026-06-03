"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/conform-dialouge";
import { useOrders } from "@/features/(erp-core)/orders/api/use-order";
import { useOrderMutations } from "@/features/(erp-core)/orders/api/use-mutation";
import { useSteadfastBalance, useSyncOrderStatus } from "@/features/(erp-core)/delivery/api/use-steadfast";
import { BookCourierDialog } from "@/features/(erp-core)/delivery/components/book-courier-dialog";
import { formatDate } from "@/lib/utils";
import { printReceipt } from "@/lib/print-receipt";
import { useCurrency } from "@/hooks/use-currency";
import {
  Loader2,
  MoreVertical,
  Printer,
  RefreshCw,
  Search,
  Truck,
  Wallet,
} from "lucide-react";
import type { Order } from "@/features/(erp-core)/orders/types";

type ShippingOrder = Order & {
  shippingMethod?: { name: string; duration: string } | null;
};

const ALL_STATUSES: Order["status"][] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_COLORS: Record<Order["status"], string> = {
  PENDING: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  PROCESSING: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  SHIPPED: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  DELIVERED: "bg-green-500/20 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const STATUS_DOTS: Record<Order["status"], React.ReactNode> = {
  PENDING: <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />,
  PROCESSING: <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />,
  SHIPPED: <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />,
  DELIVERED: <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />,
  CANCELLED: <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />,
};

function handlePrint(order: Order, currencySymbol: string) {
  printReceipt({
    orderNumber: order.orderNumber,
    createdAt: formatDate(order.createdAt),
    userName: order.user?.name ?? order.guestName ?? "Guest",
    shippingAddress: [
      order.shippingAddress,
      order.shippingCity,
      order.shippingState,
      order.shippingPostalCode,
      order.shippingCountry,
    ]
      .filter(Boolean)
      .join(", "),
    currencySymbol,
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    totalAmount: order.totalAmount,
  });
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [courierOrder, setCourierOrder] = useState<ShippingOrder | null>(null);

  const { data: rawOrders, isLoading } = useOrders(search);
  const { symbol: currencySymbol, formatAmount } = useCurrency();
  const { deleteOrder } = useOrderMutations();
  const { data: balanceData } = useSteadfastBalance();
  const syncStatus = useSyncOrderStatus();

  const orders = rawOrders as ShippingOrder[] | undefined;

  const filtered =
    statusFilter === "ALL"
      ? orders
      : orders?.filter((o) => o.status === statusFilter);

  const counts = ALL_STATUSES.reduce(
    (acc, s) => {
      acc[s] = orders?.filter((o) => o.status === s).length ?? 0;
      return acc;
    },
    {} as Record<Order["status"], number>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex items-center gap-2 text-sm bg-muted/50 border rounded-xl px-4 py-2">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Steadfast Balance:</span>
          <span className="font-semibold">
            {balanceData
              ? `${currencySymbol}${Number(balanceData.current_balance).toLocaleString()}`
              : "—"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ALL_STATUSES.map((s) => (
          <Card
            key={s}
            className={`cursor-pointer transition-all border-2 ${
              statusFilter === s ? "border-primary" : "border-transparent"
            }`}
            onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
          >
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                {STATUS_DOTS[s]}
                {s}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <p className="text-2xl font-bold">{counts[s]}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {statusFilter !== "ALL" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("ALL")}
          >
            Clear filter
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tracking #</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && filtered?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtered?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.user?.name ?? order.guestName ?? "Guest"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.user?.email ?? order.guestPhone ?? "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(order.totalAmount)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {order.trackingNumber ? (
                        <span className="text-green-600 dark:text-green-400">
                          {order.trackingNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.paymentStatus.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(order, currencySymbol)}
                          className="gap-1.5"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </Button>

                        {order.status !== "DELIVERED" &&
                          order.status !== "CANCELLED" &&
                          !order.trackingNumber && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
                              onClick={() => setCourierOrder(order)}
                            >
                              <Truck className="h-3.5 w-3.5" />
                              Book
                            </Button>
                          )}

                        {order.trackingNumber && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={syncStatus.isPending}
                            onClick={() => syncStatus.mutate(order.id)}
                          >
                            {syncStatus.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Sync
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="sm" />}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setSelectedOrder({
                                  ...order,
                                  items: order.items.map((item) => ({
                                    ...item,
                                    images: item.product.images || [],
                                  })),
                                  payment:
                                    order.payment === null
                                      ? undefined
                                      : {
                                          transactionId:
                                            order.payment?.transactionId ?? undefined,
                                          last4Digits:
                                            order.payment?.last4Digits ?? undefined,
                                        },
                                })
                              }
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setDeleteOrderId(order.id)}
                              className="text-red-600"
                            >
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-3xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Order Details - {selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Shipping Information</h3>
                    <div className="text-sm space-y-0.5">
                      <p className="font-medium">{selectedOrder.user?.name ?? selectedOrder.guestName ?? "Guest"}</p>
                      {(selectedOrder.user?.phone ?? selectedOrder.guestPhone) && (
                        <p className="text-muted-foreground">{selectedOrder.user?.phone ?? selectedOrder.guestPhone}</p>
                      )}
                      <p>{selectedOrder.shippingAddress}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Payment Information</h3>
                    <div className="text-sm">
                      <p>Method: {selectedOrder.paymentMethod}</p>
                      <p>Status: {selectedOrder.paymentStatus}</p>
                      {selectedOrder.payment?.transactionId && (
                        <p>
                          Transaction ID: {selectedOrder.payment.transactionId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 items-start p-4 bg-muted/25 rounded-lg"
                      >
                        {item.product.images?.[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            width={120}
                            height={80}
                            className="rounded-lg border"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <div className="text-sm text-muted-foreground mt-1">
                            <p>Quantity: {item.quantity}</p>
                            <p>Price: {formatAmount(item.price)}</p>
                            {item.size && <p>Size: {item.size}</p>}
                            {item.color && <p>Color: {item.color}</p>}
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatAmount(item.quantity * item.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatAmount(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatAmount(selectedOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatAmount(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {courierOrder && (
        <BookCourierDialog
          order={courierOrder}
          open={!!courierOrder}
          onOpenChange={(open) => !open && setCourierOrder(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteOrderId}
        onOpenChange={() => setDeleteOrderId(null)}
        onConfirm={() => {
          if (deleteOrderId) {
            deleteOrder.mutate(deleteOrderId);
            setDeleteOrderId(null);
          }
        }}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
      />
    </div>
  );
}
