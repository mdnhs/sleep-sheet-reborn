"use client";

import { ConfirmDialog } from "@/components/conform-dialouge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BulkInvoicePDF,
  InvoicePDF,
} from "@/features/checkout/components/invoice-pdf";
import { useOrderMutations } from "@/features/order/api/use-mutation";
import { useOrders } from "@/features/order/api/use-order";
import type { Order } from "@/features/order/types";
import {
  useBookCourier,
  useSteadfastBalance,
  useSteadfastTrackingStatuses,
  useSyncOrderStatus,
  useTrackSingleOrder,
} from "@/features/steadfast/api/use-steadfast";
import { BookCourierDialog } from "@/features/steadfast/components/book-courier-dialog";
import { BulkBookCourierDialog } from "@/features/steadfast/components/bulk-book-courier-dialog";
import { useCurrency } from "@/hooks/use-currency";
import { useWebsiteSettings } from "@/hooks/use-website-settings";
import { cn, formatDate } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Copy,
  FileText,
  FilterX,
  Loader2,
  MoreVertical,
  Pointer,
  Printer,
  RefreshCw,
  Search,
  Trash,
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  PROCESSING: (
    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
  ),
  SHIPPED: <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />,
  DELIVERED: (
    <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
  ),
  CANCELLED: <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />,
};

const STEADFAST_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Pickup",
  in_review: "In Review",
  hold: "On Hold",
  cancelled: "Cancelled",
  cancelled_approval_pending: "Cancellation Pending",
  delivered: "Delivered",
  partial_delivered: "Partially Delivered",
  delivered_approval_pending: "Delivery Confirmed",
  partial_delivered_approval_pending: "Partial Delivery Confirmed",
  not_delivered: "Not Delivered",
  returned: "Returned",
  "fast-track": "Fast Track",
  "hub-transfer": "Hub Transfer",
  "office-delivery": "Out for Delivery",
  "partial-return": "Partial Return",
  "partial-not-delivered": "Partial Not Delivered",
};

const STEADFAST_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
  in_review: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700",
  hold: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700",
  cancelled: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  cancelled_approval_pending: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  delivered: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
  partial_delivered: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
  delivered_approval_pending: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
  partial_delivered_approval_pending: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
  not_delivered: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  returned: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  "fast-track": "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700",
  "hub-transfer": "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700",
  "office-delivery": "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "ALL">(
    "PENDING",
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [courierOrder, setCourierOrder] = useState<ShippingOrder | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkBooking, setIsBulkBooking] = useState(false);
  const [isBulkBookDialogOpen, setIsBulkBookDialogOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [shippingCostOrder, setShippingCostOrder] =
    useState<ShippingOrder | null>(null);
  const [newShippingCost, setNewShippingCost] = useState("");
  const [itemCosts, setItemCosts] = useState<Record<string, string>>({});
  const [profitBreakdownOrder, setProfitBreakdownOrder] =
    useState<ShippingOrder | null>(null);

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
  const { data: balanceData, isLoading: isBalanceLoading } =
    useSteadfastBalance(showBalance);
  const syncStatus = useSyncOrderStatus();
  const trackSingleOrder = useTrackSingleOrder();
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const orders = rawOrders as ShippingOrder[] | undefined;

  const trackedOrderIds =
    orders?.filter((o) => o.trackingNumber).map((o) => o.id) ?? [];
  const { data: trackingStatuses } =
    useSteadfastTrackingStatuses(trackedOrderIds);

  const handlePrint = async (
    order: Order,
    action: "print" | "download" = "print",
  ) => {
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
        })),
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
        ]
          .filter(Boolean)
          .join(", "),
        shippingZone: "inside_dhaka",
        notes: order.note,
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
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
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
          })),
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
          ]
            .filter(Boolean)
            .join(", "),
          shippingZone: "inside_dhaka",
          notes: order.note,
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
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
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

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success("Phone number copied");
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleQuickTrack = (order: ShippingOrder) => {
    trackSingleOrder.mutate(order.id);
  };

  const getSteadfastDisplay = (order: ShippingOrder) => {
    if (!order.trackingNumber) return null;
    const tracking = trackingStatuses?.[order.id];
    if (!tracking) return null;
    return {
      status: tracking.delivery_status,
      label:
        STEADFAST_STATUS_LABELS[tracking.delivery_status] ??
        tracking.delivery_status,
      color:
        STEADFAST_STATUS_COLORS[tracking.delivery_status] ??
        "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700",
    };
  };

  const getPhone = (order: ShippingOrder) =>
    (order.user?.phone ?? order.guestPhone ?? "").replace(/\D/g, "");

  const getProfit = (order: ShippingOrder) => {
    const totalCost = order.items.reduce(
      (sum, item) => sum + (item.costPrice ?? 0) * item.quantity,
      0,
    );
    return order.subtotal - totalCost - order.shippingCost;
  };

  const filtered =
    statusFilter === "ALL"
      ? orders
      : orders?.filter((o) => o.status === statusFilter);

  const selectedOrders =
    filtered?.filter((_, index) => rowSelection[index.toString()]) || [];

  const handleBulkBook = () => {
    if (selectedOrders.length === 0) return;
    setIsBulkBookDialogOpen(true);
  };

  const handleConfirmBulkBook = async (
    costPrices: { orderItemId: string; costPrice: number }[],
    shippingCosts: { orderId: string; shippingCost: number }[],
  ) => {
    setIsBulkBooking(true);
    setIsBulkBookDialogOpen(false);
    try {
      let successCount = 0;
      for (const order of selectedOrders) {
        if (order.trackingNumber) continue;
        const phone = (order.user?.phone ?? order.guestPhone ?? "")
          .replace(/\D/g, "")
          .slice(0, 11);
        if (phone.length === 11) {
          // If this order's shipping cost was edited, update it in the DB first!
          const orderShipCostObj = shippingCosts.find(
            (s) => s.orderId === order.id,
          );
          if (
            orderShipCostObj &&
            orderShipCostObj.shippingCost !== order.shippingCost
          ) {
            await updateOrder.mutateAsync({
              id: order.id,
              shippingCost: orderShipCostObj.shippingCost,
            });
          }

          // filter the costPrices for this specific order
          const orderItemIds = order.items.map((i: any) => i.id);
          const orderCostPrices = costPrices.filter((c) =>
            orderItemIds.includes(c.orderItemId),
          );

          await bookCourier.mutateAsync({
            orderId: order.id,
            recipient_phone: phone,
            costPrices:
              orderCostPrices.length > 0 ? orderCostPrices : undefined,
          });
          successCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully booked ${successCount} orders`);
        setRowSelection({});
      } else {
        toast.error(
          "No selected orders could be booked (invalid phone or already booked)",
        );
      }
    } catch (error: any) {
      toast.error(
        error.message || "Failed to complete booking for some orders",
      );
    } finally {
      setIsBulkBooking(false);
    }
  };

  const counts = ALL_STATUSES.reduce(
    (acc, s) => {
      acc[s] = orders?.filter((o) => o.status === s).length ?? 0;
      return acc;
    },
    {} as Record<Order["status"], number>,
  );

  const columns: ColumnDef<ShippingOrder>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-input"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(value) =>
            table.toggleAllPageRowsSelected(!!value.target.checked)
          }
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
        <span className="font-mono font-medium">
          {row.original.orderNumber}
        </span>
      ),
    },
    {
      id: "saleType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.saleType;
        return (
          <Badge
            variant="outline"
            className={
              type === "POS"
                ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800"
                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
            }
          >
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
        const phone = getPhone(order);
        const hasNotes = !!order.note;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {order.user?.name ?? order.guestName ?? "Guest"}
              </span>
              {hasNotes && (
                <span title={order.note ?? ""}>
                  <FileText className="h-3 w-3 text-muted-foreground" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{order.user?.email ?? order.guestPhone ?? "-"}</span>
              {phone && phone.length >= 11 && (
                <button
                  type="button"
                  onClick={() => handleCopyPhone(phone)}
                  className="ml-0.5 hover:text-foreground transition-colors"
                  title="Copy phone number"
                >
                  {copiedPhone === phone ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <span>{formatAmount(row.original.totalAmount)}</span>,
    },
    {
      id: "profit",
      header: "Profit",
      cell: ({ row }) => {
        const order = row.original;
        const profit = getProfit(order);
        const hasCostData = order.items.some(
          (i) => i.costPrice !== null && i.costPrice !== undefined,
        );
        if (!hasCostData) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
          <button
            type="button"
            onClick={() => setProfitBreakdownOrder(order)}
            className={cn(
              "font-medium text-sm hover:underline cursor-pointer",
              profit >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {profit >= 0 ? "+" : ""}
            {formatAmount(profit)}
          </button>
        );
      },
    },
    {
      accessorKey: "trackingNumber",
      header: "Tracking #",
      cell: ({ row }) => {
        const order = row.original;
        const trk = order.trackingNumber;
        const isTracking = trackSingleOrder.isPending;
        if (!trk) {
          return (
            <span className="text-muted-foreground">—</span>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <a
              href={`https://steadfast.com.bd/t/${trk}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-green-600 dark:text-green-400 hover:underline"
              title="Open Steadfast tracking page"
            >
              {trk}
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 shrink-0"
              title="Refresh Steadfast status"
              disabled={isTracking}
              onClick={() => handleQuickTrack(order)}
            >
              <RefreshCw
                className={cn(
                  "h-3 w-3",
                  isTracking && "animate-spin",
                )}
              />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const order = row.original;
        const sfDisplay = getSteadfastDisplay(order);
        if (sfDisplay) {
          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant="outline"
                className={cn("w-fit text-xs border", sfDisplay.color)}
              >
                <Truck className="h-3 w-3 mr-1 shrink-0" />
                {sfDisplay.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Internal: {order.status}
              </span>
            </div>
          );
        }
        return (
          <Badge className={STATUS_COLORS[order.status]}>
            {order.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const order = row.original;
        const canBook =
          !order.trackingNumber &&
          order.status !== "DELIVERED" &&
          order.status !== "CANCELLED";
        return (
          <div className="flex items-center justify-end gap-2">
            {canBook && (
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => setCourierOrder(order)}
                className="gap-1.5 shrink-0"
                title="Book Steadfast Courier"
              >
                <Truck className="h-3.5 w-3.5" />
                Book
              </Button>
            )}
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
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ALL_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => updateOrderStatus(order, status)}
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
                <DropdownMenuItem
                  onClick={() => handlePrint(order, "download")}
                >
                  Download Invoice
                </DropdownMenuItem>
                {canBook && (
                  <DropdownMenuItem onClick={() => setCourierOrder(order)}>
                    Book Courier (Steadfast)
                  </DropdownMenuItem>
                )}
                {order.trackingNumber && (
                  <DropdownMenuItem
                    disabled={syncStatus.isPending}
                    onClick={() => syncStatus.mutate(order.id)}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", syncStatus.isPending && "animate-spin")} />
                    Sync Courier Status
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    setShippingCostOrder(order);
                    setNewShippingCost(order.shippingCost.toString());
                    const costs: Record<string, string> = {};
                    order.items.forEach((item) => {
                      costs[item.id] = item.costPrice?.toString() || "";
                    });
                    setItemCosts(costs);
                  }}
                >
                  Edit Order Costs
                </DropdownMenuItem>
                {order.note && (
                  <DropdownMenuItem
                    onClick={() => {
                      toast.info(order.note ?? "No notes", {
                        description: `Note for ${order.orderNumber}`,
                      });
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Note
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
              showBalance ? "translate-x-[194px]" : "translate-x-0",
            )}
          >
            <Pointer className="h-[18px] w-[18px] text-[#00bfa5] -rotate-[15deg]" />
          </div>

          {/* Balance Amount (Slide in from left) */}
          <div
            className={cn(
              "absolute left-[16px] transition-all duration-300 ease-out pr-[50px] truncate",
              showBalance
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-4 pointer-events-none",
            )}
          >
            {isBalanceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#00bfa5]" />
            ) : (
              <span className="text-sm font-semibold text-[#00bfa5] tracking-wide">
                {currencySymbol}
                {balanceData
                  ? Number(balanceData.current_balance).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 },
                    )
                  : "0.00"}
              </span>
            )}
          </div>

          {/* "Check Balance" label */}
          <div
            className={cn(
              "absolute right-[24px] transition-all duration-300 ease-out",
              showBalance
                ? "opacity-0 translate-x-4 pointer-events-none"
                : "opacity-100 translate-x-0",
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
        onValueChange={(value) =>
          setStatusFilter(value as Order["status"] | "ALL")
        }
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
              {selectedOrders.filter((o) => o.trackingNumber).length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tracked = selectedOrders.filter((o) => o.trackingNumber);
                    tracked.forEach((o) => syncStatus.mutate(o.id));
                  }}
                  disabled={syncStatus.isPending}
                  className="rounded-xl gap-1 shrink-0 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                >
                  {syncStatus.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Sync Tracked ({selectedOrders.filter((o) => o.trackingNumber).length})
                </Button>
              )}
            </div>
          }
        />
      )}

      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Order Details - {selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Shipping Information</h3>
                    <div className="text-sm space-y-0.5">
                      <p className="font-medium">
                        {selectedOrder.user?.name ??
                          selectedOrder.guestName ??
                          "Guest"}
                      </p>
                      {(selectedOrder.user?.phone ??
                        selectedOrder.guestPhone) && (
                        <p className="text-muted-foreground">
                          {selectedOrder.user?.phone ??
                            selectedOrder.guestPhone}
                        </p>
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

                {selectedOrder.trackingNumber && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">Steadfast Tracking: </span>
                      <span className="font-mono">{selectedOrder.trackingNumber}</span>
                    </div>
                    {trackingStatuses?.[selectedOrder.id] && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-auto text-xs border",
                          STEADFAST_STATUS_COLORS[
                            trackingStatuses[selectedOrder.id].delivery_status
                          ] ?? "",
                        )}
                      >
                        {STEADFAST_STATUS_LABELS[
                          trackingStatuses[selectedOrder.id].delivery_status
                        ] ?? trackingStatuses[selectedOrder.id].delivery_status}
                      </Badge>
                    )}
                  </div>
                )}

                {selectedOrder.note && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <FileText className="h-4 w-4" />
                      Note
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.note}
                    </p>
                  </div>
                )}

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
                  {(() => {
                    const profit = getProfit(selectedOrder);
                    const hasCostData = selectedOrder.items.some(
                      (i) => i.costPrice !== null && i.costPrice !== undefined,
                    );
                    if (!hasCostData) return null;
                    return (
                      <div
                        className={cn(
                          "flex justify-between font-medium pt-1 border-t",
                          profit >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        <span>Profit:</span>
                        <span>
                          {profit >= 0 ? "+" : ""}
                          {formatAmount(profit)}
                        </span>
                      </div>
                    );
                  })()}
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
      <Dialog
        open={!!shippingCostOrder}
        onOpenChange={(open) => !open && setShippingCostOrder(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Order Costs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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
            {shippingCostOrder?.items.map((item) => (
              <div key={item.id} className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground truncate block">
                  Bought Price (Cost) for: {item.product?.name || "Item"}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={itemCosts[item.id] || ""}
                  onChange={(e) =>
                    setItemCosts({ ...itemCosts, [item.id]: e.target.value })
                  }
                  placeholder="Enter bought price"
                />
              </div>
            ))}
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

                  const itemsToUpdate = shippingCostOrder.items.map((item) => ({
                    id: item.id,
                    costPrice: parseFloat(itemCosts[item.id] || "0") || 0,
                  }));

                  try {
                    await updateOrder.mutateAsync({
                      id: shippingCostOrder.id,
                      shippingCost: cost,
                      items: itemsToUpdate,
                    });
                    toast.success("Order costs updated successfully");
                    setShippingCostOrder(null);
                  } catch (error) {
                    toast.error("Failed to update order costs");
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

      <Dialog
        open={!!profitBreakdownOrder}
        onOpenChange={(open) => !open && setProfitBreakdownOrder(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
          <DialogHeader className="px-6 py-5 border-b bg-muted/20">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              Profit Breakdown Invoice
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {profitBreakdownOrder && (() => {
              const order = profitBreakdownOrder;
              const itemsRevenue = order.subtotal;
              const itemsCost = order.items.reduce(
                (sum, item) => sum + (item.costPrice ?? 0) * item.quantity,
                0,
              );
              const shippingCost = order.shippingCost;
              const totalCost = itemsCost + shippingCost;
              const profit = itemsRevenue - totalCost;

              return (
                <div className="p-6">
                  <div className="rounded-lg border shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-medium h-10">Product</TableHead>
                          <TableHead className="text-right font-medium h-10">Qty</TableHead>
                          <TableHead className="text-right font-medium h-10">Revenue</TableHead>
                          <TableHead className="text-right font-medium h-10">Unit Cost</TableHead>
                          <TableHead className="text-right font-medium h-10">Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => {
                          const revenue = item.price * item.quantity;
                          const cost = (item.costPrice ?? 0) * item.quantity;
                          const itemProfit = revenue - cost;
                          const productImage = item.images?.[0] || item.product.images?.[0];
                          return (
                            <TableRow key={item.id} className="group">
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  {productImage ? (
                                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                      <Image
                                        src={productImage}
                                        alt={item.product.name}
                                        width={48}
                                        height={48}
                                        className="object-cover w-full h-full"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs text-muted-foreground">No img</span>
                                    </div>
                                  )}
                                  <div className="flex flex-col max-w-[220px] sm:max-w-[300px]">
                                    <span className="font-medium leading-tight truncate" title={item.product.name}>{item.product.name}</span>
                                    <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {item.size ? `Size: ${item.size}` : ""}
                                      {item.size && item.color ? " | " : ""}
                                      {item.color ? `Color: ${item.color}` : ""}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-4 align-middle tabular-nums">{item.quantity}</TableCell>
                              <TableCell className="text-right py-4 align-middle tabular-nums">{formatAmount(revenue)}</TableCell>
                              <TableCell className="text-right py-4 align-middle tabular-nums text-red-600 dark:text-red-400">
                                {item.costPrice != null ? formatAmount(item.costPrice) : "—"}
                              </TableCell>
                              <TableCell className="text-right py-4 align-middle">
                                <span className={cn(
                                  "font-semibold tabular-nums",
                                  itemProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                )}>
                                  {itemProfit >= 0 ? "+" : ""}{formatAmount(itemProfit)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter className="bg-muted/10 border-t-2 border-border">
                        <TableRow className="hover:bg-transparent border-0">
                          <TableCell colSpan={4} className="text-right font-medium text-muted-foreground pt-6">
                            Subtotal (Profit)
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium pt-6">
                            <span className={cn(
                                (itemsRevenue - itemsCost) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {(itemsRevenue - itemsCost) >= 0 ? "+" : ""}{formatAmount(itemsRevenue - itemsCost)}
                            </span>
                          </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-transparent border-0">
                          <TableCell colSpan={4} className="text-right font-medium text-muted-foreground pb-4">
                            Shipping Cost
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-red-600 dark:text-red-400 pb-4">
                            -{formatAmount(shippingCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-transparent border-t bg-muted/30">
                          <TableCell colSpan={4} className="text-right font-bold text-base py-4">
                            Net Profit
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <span className={cn(
                              "text-lg font-bold tracking-tight tabular-nums",
                              profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}>
                              {profit >= 0 ? "+" : ""}{formatAmount(profit)}
                            </span>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </div>
              );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
