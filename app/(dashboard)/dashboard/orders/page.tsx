"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/conform-dialouge";
import { useOrders } from "@/features/order/api/use-order";
import { useOrderMutations } from "@/features/order/api/use-mutation";
import { useSteadfastBalance, useSyncOrderStatus, useBookCourier } from "@/features/steadfast/api/use-steadfast";
import { BookCourierDialog } from "@/features/steadfast/components/book-courier-dialog";
import { formatDate } from "@/lib/utils";
import { printReceipt } from "@/lib/print-receipt";
import { useCurrency } from "@/hooks/use-currency";
import { toast } from "sonner";
import {
  Loader2,
  MoreVertical,
  Printer,
  RefreshCw,
  Search,
  Trash,
  Truck,
  Wallet,
} from "lucide-react";
import type { Order } from "@/features/order/types";

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
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "ALL">("PENDING");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [courierOrder, setCourierOrder] = useState<ShippingOrder | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkBooking, setIsBulkBooking] = useState(false);
  const bookCourier = useBookCourier();

  const { data: rawOrders, isLoading } = useOrders(search);
  const { symbol: currencySymbol, formatAmount } = useCurrency();
  const { updateOrder, deleteOrder, bulkDeleteOrders } = useOrderMutations();
  const { data: balanceData } = useSteadfastBalance();
  const syncStatus = useSyncOrderStatus();

  const handleBulkDelete = () => {
    const ids = selectedOrders.map((o) => o.id);
    bulkDeleteOrders.mutate(ids, {
      onSuccess: () => {
        toast.success("Successfully deleted selected orders");
        setRowSelection({});
        setConfirmBulkDelete(false);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to delete selected orders");
      },
    });
  };

  const orders = rawOrders as ShippingOrder[] | undefined;

  const filtered =
    statusFilter === "ALL"
      ? orders
      : orders?.filter((o) => o.status === statusFilter);

  const selectedOrders = filtered?.filter((_, index) => rowSelection[index.toString()]) || [];

  const handleBulkBook = async () => {
    if (selectedOrders.length === 0) return;
    setIsBulkBooking(true);
    try {
      let successCount = 0;
      for (const order of selectedOrders) {
        if (order.trackingNumber) continue;
        const phone = (order.user?.phone ?? order.guestPhone ?? "").replace(/\D/g, "").slice(0, 11);
        if (phone.length === 11) {
          await bookCourier.mutateAsync({
            orderId: order.id,
            recipient_phone: phone,
          });
          successCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully booked ${successCount} orders`);
        setRowSelection({});
      } else {
        toast.error("No selected orders could be booked (invalid phone or already booked)");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to complete booking for some orders");
    } finally {
      setIsBulkBooking(false);
    }
  };

  const counts = ALL_STATUSES.reduce(
    (acc, s) => {
      acc[s] = orders?.filter((o) => o.status === s).length ?? 0;
      return acc;
    },
    {} as Record<Order["status"], number>
  );

  const columns: ColumnDef<ShippingOrder>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-input"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(!!value.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-input"
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(!!value.target.checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderNumber",
      header: "Order #",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      id: "saleType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.saleType;
        return (
          <Badge variant="outline" className={type === "POS" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"}>
            {type || "WEBSITE"}
          </Badge>
        );
      },
    },
    {
      id: "reference",
      header: "Reference",
      cell: ({ row }) => {
        const ref = row.original.reference;
        return ref ? (
          <span className="font-mono text-sm">{ref}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {order.user?.name ?? order.guestName ?? "Guest"}
            </span>
            <span className="text-xs text-muted-foreground">
              {order.user?.email ?? order.guestPhone ?? "-"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <span>{formatAmount(row.original.totalAmount)}</span>,
    },
    {
      accessorKey: "trackingNumber",
      header: "Tracking #",
      cell: ({ row }) => {
        const trk = row.original.trackingNumber;
        return trk ? (
          <span className="font-mono text-sm text-green-600 dark:text-green-400">{trk}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.paymentStatus.toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={STATUS_COLORS[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const order = row.original;
        return (
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

            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ALL_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() =>
                      updateOrderStatus(order, status)
                    }
                    className="capitalize"
                  >
                    Mark as {status.toLowerCase()}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
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
                {order.status !== "DELIVERED" &&
                  order.status !== "CANCELLED" &&
                  !order.trackingNumber && (
                    <DropdownMenuItem
                      onClick={() => setCourierOrder(order)}
                    >
                      Book Courier (Steadfast)
                    </DropdownMenuItem>
                  )}
                {order.trackingNumber && (
                  <DropdownMenuItem
                    disabled={syncStatus.isPending}
                    onClick={() => syncStatus.mutate(order.id)}
                  >
                    Sync Courier Status
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOrderId(order.id)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const updateOrderStatus = (order: ShippingOrder, status: Order["status"]) => {
    updateOrder.mutate({
      id: order.id,
      status,
      paymentStatus: status === "DELIVERED" ? "PAID" : order.paymentStatus,
    });
  };

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

      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as Order["status"] | "ALL")}
        className="w-full"
      >
        <TabsList className="flex flex-wrap w-full sm:w-fit gap-1 bg-muted p-1 rounded-xl">
          <TabsTrigger
            value="ALL"
            className="rounded-lg px-4 py-2 text-sm font-semibold capitalize data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            All ({orders?.length ?? 0})
          </TabsTrigger>
          {ALL_STATUSES.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="rounded-lg px-4 py-2 text-sm font-semibold capitalize data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              {STATUS_DOTS[s]}
              {s.toLowerCase()} ({counts[s]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex gap-3 items-center">
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
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered || []}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          searchSlot={
            <div className="flex items-center gap-3 w-full">
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
                  className="shrink-0"
                >
                  Clear filter
                </Button>
              )}
              {statusFilter === "PENDING" && selectedOrders.length > 0 && (
                <Button
                  type="button"
                  onClick={handleBulkBook}
                  disabled={isBulkBooking}
                  className="gap-1.5 shrink-0 rounded-xl"
                >
                  {isBulkBooking ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Truck className="h-3.5 w-3.5" />
                  )}
                  Book Selected ({selectedOrders.length})
                </Button>
              )}
              {selectedOrders.length > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={bulkDeleteOrders.isPending}
                  className="rounded-xl gap-1 shrink-0"
                >
                  {bulkDeleteOrders.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash className="h-3.5 w-3.5" />
                  )}
                  Delete Selected ({selectedOrders.length})
                </Button>
              )}
            </div>
          }
        />
      )}

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
                            {item.color && <p>Variant: {item.color}</p>}
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

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Orders"
        description={`Are you sure you want to delete ${selectedOrders.length} selected orders? This action cannot be undone.`}
      />
    </div>
  );
}
