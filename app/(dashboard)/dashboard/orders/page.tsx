"use client";

import { useState, useEffect } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { useOrders } from "@/features/order/api/use-order";
import { useOrderMutations } from "@/features/order/api/use-mutation";
import { useSteadfastBalance, useSyncOrderStatus, useBookCourier } from "@/features/steadfast/api/use-steadfast";
import { BulkBookCourierDialog } from "@/features/steadfast/components/bulk-book-courier-dialog";
import { BookCourierDialog } from "@/features/steadfast/components/book-courier-dialog";
import { formatDate } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF, BulkInvoicePDF } from "@/features/checkout/components/invoice-pdf";
import { useWebsiteSettings } from "@/hooks/use-website-settings";
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
  FilterX,
  Download,
  Eye,
  Pointer,
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



export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "ALL">("PENDING");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [courierOrder, setCourierOrder] = useState<ShippingOrder | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkBooking, setIsBulkBooking] = useState(false);
  const [isBulkBookDialogOpen, setIsBulkBookDialogOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [shippingCostOrder, setShippingCostOrder] = useState<ShippingOrder | null>(null);
  const [newShippingCost, setNewShippingCost] = useState("");

  const queryClient = useQueryClient();
  const bookCourier = useBookCourier();

  useEffect(() => {
    if (showBalance) {
      queryClient.invalidateQueries({ queryKey: ["steadfast-balance"] });
    }
  }, [showBalance, queryClient]);

  const { data: rawOrders, isLoading } = useOrders(search);
  const { symbol: currencySymbol, formatAmount } = useCurrency();
  const { siteName, logoUrl } = useWebsiteSettings();
  const { updateOrder, deleteOrder, bulkDeleteOrders } = useOrderMutations();
  const { data: balanceData, isLoading: isBalanceLoading } = useSteadfastBalance(showBalance);
  const syncStatus = useSyncOrderStatus();

  const handlePrint = async (order: Order, action: "print" | "download" = "print") => {
    try {
      const placedOrderData: any = {
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod || "COD",
        items: order.items.map((i: any) => ({
          name: i.product.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          image: i.product.images?.[0] || null,
        }))
      };
      
      const shippingInfoData: any = {
        fullName: order.user?.name || order.guestName || "Customer",
        phone: order.user?.phone || order.guestPhone || "",
        email: order.user?.email || order.guestEmail || "",
        address: [
          order.shippingAddress,
          order.shippingCity,
          order.shippingState,
          order.shippingPostalCode,
          order.shippingCountry,
        ].filter(Boolean).join(", "),
        shippingZone: "inside_dhaka",
        notes: order.note
      };

      const doc = (
        <InvoicePDF
          order={placedOrderData}
          shippingInfo={shippingInfoData}
          siteName={siteName}
          language="en"
          logoUrl={logoUrl}
        />
      );
      
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      
      if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = `Invoice-${order.orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Invoice downloaded successfully");
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.print();
        };
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleBulkPrint = async (action: "print" | "download" = "print") => {
    if (selectedOrders.length === 0) return;
    setIsBulkPrinting(true);
    try {
      const ordersData = selectedOrders.map((order) => {
        const placedOrderData: any = {
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          paymentMethod: order.paymentMethod || "COD",
          items: order.items.map((i: any) => ({
            name: i.product.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            image: i.product.images?.[0] || null,
          }))
        };

        const shippingInfoData: any = {
          fullName: order.user?.name || order.guestName || "Customer",
          phone: order.user?.phone || order.guestPhone || "",
          email: order.user?.email || order.guestEmail || "",
          address: [
            order.shippingAddress,
            order.shippingCity,
            order.shippingState,
            order.shippingPostalCode,
            order.shippingCountry,
          ].filter(Boolean).join(", "),
          shippingZone: "inside_dhaka",
          notes: order.note
        };

        return {
          order: placedOrderData,
          shippingInfo: shippingInfoData,
        };
      });

      const doc = (
        <BulkInvoicePDF
          orders={ordersData}
          siteName={siteName}
          language="en"
          logoUrl={logoUrl}
        />
      );

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);

      if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = `Invoices-Bulk-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Bulk invoices downloaded successfully");
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.print();
        };
      }
    } catch (error) {
      console.error("Bulk PDF generation failed:", error);
      toast.error("Failed to generate bulk invoices");
    } finally {
      setIsBulkPrinting(false);
    }
  };

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

  const handleBulkBook = () => {
    if (selectedOrders.length === 0) return;
    setIsBulkBookDialogOpen(true);
  };

  const handleConfirmBulkBook = async (
    costPrices: { orderItemId: string; costPrice: number }[],
    shippingCosts: { orderId: string; shippingCost: number }[]
  ) => {
    setIsBulkBooking(true);
    setIsBulkBookDialogOpen(false);
    try {
      let successCount = 0;
      for (const order of selectedOrders) {
        if (order.trackingNumber) continue;
        const phone = (order.user?.phone ?? order.guestPhone ?? "").replace(/\D/g, "").slice(0, 11);
        if (phone.length === 11) {
          // If this order's shipping cost was edited, update it in the DB first!
          const orderShipCostObj = shippingCosts.find(s => s.orderId === order.id);
          if (orderShipCostObj && orderShipCostObj.shippingCost !== order.shippingCost) {
            await updateOrder.mutateAsync({
              id: order.id,
              shippingCost: orderShipCostObj.shippingCost,
            });
          }

          // filter the costPrices for this specific order
          const orderItemIds = order.items.map((i: any) => i.id);
          const orderCostPrices = costPrices.filter(c => orderItemIds.includes(c.orderItemId));

          await bookCourier.mutateAsync({
            orderId: order.id,
            recipient_phone: phone,
            costPrices: orderCostPrices.length > 0 ? orderCostPrices : undefined,
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
              onClick={() => handlePrint(order)}
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
                <DropdownMenuItem onClick={() => handlePrint(order, "download")}>
                  Download Invoice
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
                <DropdownMenuItem
                  onClick={() => {
                    setShippingCostOrder(order);
                    setNewShippingCost(order.shippingCost.toString());
                  }}
                >
                  Edit Shipping Cost
                </DropdownMenuItem>
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
      paymentStatus: status === "DELIVERED" ? "COMPLETED" : order.paymentStatus,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Order Management</h1>
        
        <div 
          onClick={() => setShowBalance(!showBalance)}
          className="relative flex items-center h-12 w-[240px] rounded-full border border-[#00bfa5] bg-white dark:bg-slate-900 select-none cursor-pointer transition-all duration-200"
        >
          {/* Sliding indicator */}
          <div 
            className={cn(
              "absolute top-[4px] left-[4px] h-[38px] w-[38px] rounded-full bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-300 ease-out z-10",
              showBalance ? "translate-x-[194px]" : "translate-x-0"
            )}
          >
            <Pointer className="h-[18px] w-[18px] text-[#00bfa5] -rotate-[15deg]" />
          </div>

          {/* Balance Amount (Slide in from left) */}
          <div 
            className={cn(
              "absolute left-[16px] transition-all duration-300 ease-out pr-[50px] truncate",
              showBalance ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
            )}
          >
            {isBalanceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#00bfa5]" />
            ) : (
              <span className="text-sm font-semibold text-[#00bfa5] tracking-wide">
                {currencySymbol}{balanceData ? Number(balanceData.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
              </span>
            )}
          </div>

          {/* "Check Balance" label */}
          <div 
            className={cn(
              "absolute right-[24px] transition-all duration-300 ease-out",
              showBalance ? "opacity-0 translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"
            )}
          >
            <span className="text-sm font-semibold text-[#00bfa5] tracking-wide">
              Check Balance
            </span>
          </div>
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as Order["status"] | "ALL")}
        className="w-full"
      >
        <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
          <TabsList className="flex flex-nowrap h-auto w-max sm:w-fit gap-1 bg-muted p-1 rounded-xl">
            <TabsTrigger
              value="ALL"
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold capitalize data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              All ({orders?.length ?? 0})
            </TabsTrigger>
            {ALL_STATUSES.map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold capitalize data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
              >
                {STATUS_DOTS[s]}
                {s.toLowerCase()} ({counts[s]})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
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
                className="gap-1.5"
              >
                <FilterX className="h-3.5 w-3.5" />
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
            <div className="flex flex-wrap items-center gap-3 w-full">
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
                  className="shrink-0 gap-1.5"
                >
                  <FilterX className="h-3.5 w-3.5" />
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
                  variant="outline"
                  onClick={() => handleBulkPrint("print")}
                  disabled={isBulkPrinting}
                  className="rounded-xl gap-1 shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                >
                  {isBulkPrinting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" />
                  )}
                  Print Selected ({selectedOrders.length})
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
      
      <BulkBookCourierDialog 
        open={isBulkBookDialogOpen}
        onOpenChange={setIsBulkBookDialogOpen}
        orders={selectedOrders}
        onConfirm={handleConfirmBulkBook}
        isBooking={isBulkBooking}
      />
      <Dialog open={!!shippingCostOrder} onOpenChange={(open) => !open && setShippingCostOrder(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Shipping Cost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Shipping Cost (৳)</label>
              <Input
                type="number"
                min="0"
                value={newShippingCost}
                onChange={(e) => setNewShippingCost(e.target.value)}
                placeholder="Enter shipping cost"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShippingCostOrder(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!shippingCostOrder) return;
                  const cost = parseFloat(newShippingCost);
                  if (isNaN(cost) || cost < 0) {
                    toast.error("Please enter a valid shipping cost");
                    return;
                  }
                  
                  try {
                    await updateOrder.mutateAsync({
                      id: shippingCostOrder.id,
                      shippingCost: cost,
                    });
                    toast.success("Shipping cost updated successfully");
                    setShippingCostOrder(null);
                  } catch (error) {
                    toast.error("Failed to update shipping cost");
                  }
                }}
                disabled={updateOrder.isPending}
              >
                {updateOrder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
