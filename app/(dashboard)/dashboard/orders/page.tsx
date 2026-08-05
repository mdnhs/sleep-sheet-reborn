"use client";

import React, { Suspense } from "react";
import { ConfirmDialog } from "@/components/conform-dialouge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { type DateRange } from "react-day-picker";
import { isToday, format, parseISO, startOfDay, endOfDay } from "date-fns";
import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useOrderMutations } from "@/features/order/api/use-mutation";
import { useOrders } from "@/features/order/api/use-order";
import { useActivityLogs } from "@/features/activity/api/use-activity-logs";
import type { Order } from "@/features/order/types";
import {
  useBookCourier,
  useSteadfastBalance,
  useSteadfastTrackingStatuses,
  useSyncBatchOrderStatus,
  useTrackSingleOrder,
} from "@/features/steadfast/api/use-steadfast";
import { BookCourierDialog } from "@/features/steadfast/components/book-courier-dialog";
import { BulkBookCourierDialog } from "@/features/steadfast/components/bulk-book-courier-dialog";
import { useCurrency } from "@/hooks/use-currency";
import { useWebsiteSettings } from "@/hooks/use-website-settings";
import { cn, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  FilterX,
  History,
  Loader2,
  MoreVertical,
  Pointer,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Trash,
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Globe,
  Smartphone,
  Laptop,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ShippingOrder = Order & {
  shippingMethod?: { name: string; duration: string } | null;
};

// Once an order reaches one of these, Steadfast will never move it again
// (mapSteadfastStatus can't produce REFUNDED, and DELIVERED/CANCELLED are
// dead ends) — so polling or refreshing its courier status is pure waste.
// Keep these orders out of the auto-poll and bulk refresh/sync calls.
const TERMINAL_ORDER_STATUSES = new Set<Order["status"]>(["DELIVERED", "CANCELLED", "REFUNDED"]);
const isTrackable = (o: ShippingOrder) => !!o.trackingNumber && !TERMINAL_ORDER_STATUSES.has(o.status);

const STATUS_COLORS: Record<Order["status"], string> = {
  PENDING: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  PROCESSING: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  SHIPPED: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  DELIVERED: "bg-green-500/20 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-500/20 text-red-700 dark:text-red-400",
  REFUNDED: "bg-rose-500/20 text-rose-700 dark:text-rose-400",
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
  REFUNDED: <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />,
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
  pending:
    "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
  in_review:
    "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700",
  hold: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700",
  cancelled:
    "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  cancelled_approval_pending:
    "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  delivered:
    "bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
  partial_delivered:
    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
  delivered_approval_pending:
    "bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
  partial_delivered_approval_pending:
    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
  not_delivered:
    "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  returned:
    "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  "fast-track":
    "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700",
  "hub-transfer":
    "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700",
  "office-delivery":
    "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700",
};

type StatusFilter =
  | "ALL"
  | "TODAY"
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

function OrdersPageContent() {
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [fromStr, setFromStr] = useQueryState(
    "from",
    parseAsString.withDefault("")
  );
  const [toStr, setToStr] = useQueryState(
    "to",
    parseAsString.withDefault("")
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum<StatusFilter>([
      "ALL",
      "TODAY",
      "PENDING",
      "CONFIRMED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ]).withDefault("PENDING")
  );

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!fromStr) return undefined;
    try {
      const fromDate = parseISO(fromStr);
      const toDate = toStr ? parseISO(toStr) : undefined;
      if (isNaN(fromDate.getTime())) return undefined;
      return {
        from: fromDate,
        to: toDate && !isNaN(toDate.getTime()) ? toDate : undefined,
      };
    } catch {
      return undefined;
    }
  }, [fromStr, toStr]);

  const setDateRange = (range: DateRange | undefined) => {
    setFromStr(range?.from ? format(range.from, "yyyy-MM-dd") : null);
    setToStr(range?.to ? format(range.to, "yyyy-MM-dd") : null);
  };
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [logDetailsOrder, setLogDetailsOrder] = useState<ShippingOrder | null>(null);
  const [showAllOrderItems, setShowAllOrderItems] = useState(false);
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
  const [cancelTarget, setCancelTarget] = useState<ShippingOrder | null>(null);
  const [refundTarget, setRefundTarget] = useState<ShippingOrder | null>(null);
  const [refundMode, setRefundMode] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundRestock, setRefundRestock] = useState(true);

  const queryClient = useQueryClient();
  const bookCourier = useBookCourier();

  useEffect(() => {
    if (showBalance) {
      queryClient.invalidateQueries({ queryKey: ["steadfast-balance"] });
    }
  }, [showBalance, queryClient]);

  const rangeFilter = React.useMemo(() => {
    if (!fromStr) return undefined;
    try {
      const fromDate = parseISO(fromStr);
      const toDate = toStr ? parseISO(toStr) : fromDate;
      if (isNaN(fromDate.getTime())) return undefined;
      const validToDate = !isNaN(toDate.getTime()) ? toDate : fromDate;
      return {
        from: startOfDay(fromDate).toISOString(),
        to: endOfDay(validToDate).toISOString(),
      };
    } catch {
      return undefined;
    }
  }, [fromStr, toStr]);

  const { data: rawOrders, isLoading } = useOrders(search, rangeFilter);
  const { symbol: currencySymbol, formatAmount } = useCurrency();
  const { siteName, logoUrl, footerPhone } = useWebsiteSettings();
  const { updateOrder, cancelOrder, refundOrder, deleteOrder, bulkDeleteOrders } =
    useOrderMutations();
  const { data: balanceData, isLoading: isBalanceLoading } =
    useSteadfastBalance(showBalance);
  const syncBatch = useSyncBatchOrderStatus();
  const trackSingleOrder = useTrackSingleOrder();
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [isRefetchingSteadfast, setIsRefetchingSteadfast] = useState(false);

  const handleRefreshAllSteadfast = async () => {
    setIsRefetchingSteadfast(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["steadfast-tracking-statuses"] }),
        queryClient.invalidateQueries({ queryKey: ["steadfast-balance"] }),
      ]);
      const trackedOrders = orders?.filter(isTrackable) ?? [];
      if (trackedOrders.length > 0) {
        // The mutation's own onSuccess toast reports how many orders actually
        // changed, which is more useful than a blanket "done" message here.
        await syncBatch.mutateAsync(trackedOrders.map((o) => o.id));
      } else {
        toast.success("Steadfast statuses re-fetched successfully");
      }
    } catch (err) {
      toast.error("Failed to re-fetch status");
    } finally {
      setIsRefetchingSteadfast(false);
    }
  };

  const orders = rawOrders as ShippingOrder[] | undefined;

  // Excludes delivered/cancelled/refunded orders — their courier status is
  // final, so there's nothing left to poll every 60s (see isTrackable above).
  const trackedOrderIds =
    orders?.filter(isTrackable).map((o) => o.id) ?? [];
  const { data: trackingStatuses } =
    useSteadfastTrackingStatuses(trackedOrderIds);

  const handlePrint = async (
    order: Order,
    action: "print" | "download" = "print",
  ) => {
    try {
      // Load the PDF renderer on demand — it is far too heavy to ship in the
      // page bundle for a click-only feature.
      const [{ pdf }, { InvoicePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/features/checkout/components/invoice-pdf"),
      ]);
      const consignmentId =
        trackingStatuses?.[order.id]?.consignment_id ||
        (order.trackingNumber && /^\d+$/.test(order.trackingNumber)
          ? Number(order.trackingNumber)
          : null);

      const placedOrderData: any = {
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod || "COD",
        trackingNumber:
          order.trackingNumber ||
          trackingStatuses?.[order.id]?.tracking_code ||
          null,
        consignmentId: consignmentId,
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
          language="bn"
          logoUrl={logoUrl}
          phoneNumber={footerPhone}
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
      const [{ pdf }, { BulkInvoicePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/features/checkout/components/invoice-pdf"),
      ]);
      const ordersData = selectedOrders.map((order) => {
        const consignmentId =
          trackingStatuses?.[order.id]?.consignment_id ||
          (order.trackingNumber && /^\d+$/.test(order.trackingNumber)
            ? Number(order.trackingNumber)
            : null);

        const placedOrderData: any = {
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          paymentMethod: order.paymentMethod || "COD",
          trackingNumber:
            order.trackingNumber ||
            trackingStatuses?.[order.id]?.tracking_code ||
            null,
          consignmentId: consignmentId,
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
          language="bn"
          logoUrl={logoUrl}
          phoneNumber={footerPhone}
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

  const openOrderDetails = (order: ShippingOrder) => {
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
              transactionId: order.payment?.transactionId ?? undefined,
              last4Digits: order.payment?.last4Digits ?? undefined,
            },
    });
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

  const isCancelled = (o: ShippingOrder) => {
    const sfStatus = trackingStatuses?.[o.id]?.delivery_status;
    return (
      o.status === "CANCELLED" ||
      sfStatus === "cancelled" ||
      sfStatus === "cancelled_approval_pending"
    );
  };

  const isReturned = (o: ShippingOrder) => {
    const sfStatus = trackingStatuses?.[o.id]?.delivery_status;
    return (
      o.status === "REFUNDED" ||
      (o.refundedAmount ?? 0) > 0 ||
      sfStatus === "returned" ||
      sfStatus === "partial-return" ||
      sfStatus === "not_delivered" ||
      sfStatus === "partial-not-delivered"
    );
  };

  const isDelivered = (o: ShippingOrder) => {
    if (isCancelled(o) || isReturned(o)) return false;
    const sfStatus = trackingStatuses?.[o.id]?.delivery_status;
    return (
      o.status === "DELIVERED" ||
      sfStatus === "delivered" ||
      sfStatus === "partial_delivered" ||
      sfStatus === "delivered_approval_pending" ||
      sfStatus === "partial_delivered_approval_pending"
    );
  };

  const isConfirmed = (o: ShippingOrder) => {
    if (isCancelled(o) || isReturned(o)) return false;

    const isPosShowroom =
      o.saleType === "POS" &&
      (o.status === "DELIVERED" || o.shippingAddress?.includes("In-store pickup"));

    if (isPosShowroom) return true;

    const sfStatus = trackingStatuses?.[o.id]?.delivery_status;
    const isBookedInSteadfast = Boolean(o.trackingNumber);
    const isProcessingOrShipped =
      o.status === "PROCESSING" || o.status === "SHIPPED";
    const hasActiveSteadfastStatus = Boolean(
      sfStatus &&
        [
          "pending",
          "in_review",
          "hold",
          "fast-track",
          "hub-transfer",
          "office-delivery",
        ].includes(sfStatus),
    );

    return isBookedInSteadfast || isProcessingOrShipped || hasActiveSteadfastStatus;
  };

  const isPending = (o: ShippingOrder) => {
    if (isCancelled(o) || isReturned(o)) return false;
    if (isConfirmed(o) || isDelivered(o)) return false;
    return o.status === "PENDING";
  };

  const filtered =
    statusFilter === "ALL"
      ? orders
      : statusFilter === "TODAY"
        ? orders?.filter((o) => isToday(new Date(o.createdAt)))
        : statusFilter === "PENDING"
          ? orders?.filter((o) => isPending(o))
          : statusFilter === "CONFIRMED"
            ? orders?.filter((o) => isConfirmed(o))
            : statusFilter === "DELIVERED"
              ? orders?.filter((o) => isDelivered(o))
              : statusFilter === "CANCELLED"
                ? orders?.filter((o) => isCancelled(o))
                : statusFilter === "RETURNED"
                  ? orders?.filter((o) => isReturned(o))
                  : orders;

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

  const todayCount =
    orders?.filter((o) => isToday(new Date(o.createdAt))).length ?? 0;
  const pendingCount = orders?.filter((o) => isPending(o)).length ?? 0;
  const confirmedCount = orders?.filter((o) => isConfirmed(o)).length ?? 0;
  const deliveredCount = orders?.filter((o) => isDelivered(o)).length ?? 0;
  const cancelledCount = orders?.filter((o) => isCancelled(o)).length ?? 0;
  const returnedCount = orders?.filter((o) => isReturned(o)).length ?? 0;

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
          onClick={(e) => e.stopPropagation()}
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
      enableHiding: true,
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
      enableHiding: true,
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPhone(phone);
                  }}
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
        <div className="whitespace-nowrap">
          <div className="text-sm">{formatDate(row.original.createdAt)}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        </div>
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
            onClick={(e) => {
              e.stopPropagation();
              setProfitBreakdownOrder(order);
            }}
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
      enableHiding: true,
      cell: ({ row }) => {
        const order = row.original;
        const trk = order.trackingNumber;
        if (!trk) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <a
            href={`https://steadfast.com.bd/t/${trk}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-sm text-green-600 dark:text-green-400 hover:underline"
            title="Open Steadfast tracking page"
          >
            {trk}
          </a>
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
            <Badge
              variant="outline"
              className={cn("w-fit text-xs border", sfDisplay.color)}
            >
              <Truck className="h-3 w-3 mr-1 shrink-0" />
              {sfDisplay.label}
            </Badge>
          );
        }
        return (
          <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const order = row.original;
        const orderIsCancelled = isCancelled(order);
        const orderIsReturned = isReturned(order);
        const orderIsDelivered = isDelivered(order);
        const orderIsConfirmed = isConfirmed(order);
        const orderIsPending = isPending(order);

        const canBook =
          !order.trackingNumber &&
          orderIsPending &&
          !(
            order.saleType === "POS" &&
            order.shippingAddress?.includes("In-store pickup")
          );

        const canCancel =
          !orderIsCancelled && !orderIsReturned && !orderIsDelivered;

        const canRefund =
          orderIsDelivered &&
          (order.refundedAmount ?? 0) < order.totalAmount;

        return (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
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
                <DropdownMenuItem onClick={() => openOrderDetails(order)}>
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
                <DropdownMenuItem onClick={() => setLogDetailsOrder(order)}>
                  <History className="h-4 w-4 mr-2" />
                  Log Details
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
                {canCancel && (
                  <DropdownMenuItem
                    onClick={() => setCancelTarget(order)}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Order
                  </DropdownMenuItem>
                )}
                {canRefund && (
                  <DropdownMenuItem onClick={() => openRefundDialog(order)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {(order.refundedAmount ?? 0) > 0
                      ? "Refund More"
                      : "Refund Order"}
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

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancelOrder.mutate(
      { id: cancelTarget.id, restock: true },
      {
        onSuccess: () => {
          toast.success("Order cancelled and items restocked");
          setCancelTarget(null);
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to cancel order");
        },
      },
    );
  };

  const refundRemaining = (order: ShippingOrder) =>
    Math.round((order.totalAmount - (order.refundedAmount ?? 0)) * 100) / 100;

  const openRefundDialog = (order: ShippingOrder) => {
    setRefundTarget(order);
    setRefundMode("full");
    setRefundAmount(refundRemaining(order).toString());
    setRefundReason("");
    setRefundRestock(true);
  };

  const handleRefund = () => {
    if (!refundTarget) return;
    const remaining = refundRemaining(refundTarget);
    const amount =
      refundMode === "full" ? remaining : parseFloat(refundAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid refund amount");
      return;
    }
    if (amount > remaining + 0.005) {
      toast.error(`Refund cannot exceed ${formatAmount(remaining)}`);
      return;
    }

    refundOrder.mutate(
      {
        id: refundTarget.id,
        amount,
        reason: refundReason.trim() || undefined,
        restock: refundRestock,
      },
      {
        onSuccess: () => {
          toast.success("Refund processed successfully");
          setRefundTarget(null);
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to process refund");
        },
      },
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
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
        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        className="w-full"
      >
        <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
          <TabsList className="flex flex-nowrap items-center h-9 w-max sm:w-fit gap-1 bg-slate-100 dark:bg-muted/40 p-1 rounded-full">
            <TabsTrigger
              value="ALL"
              className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold capitalize cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              All ({orders?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="TODAY"
              className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold capitalize cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Today ({todayCount})
            </TabsTrigger>
            <TabsTrigger
              value="PENDING"
              className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold capitalize cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
            >
              {STATUS_DOTS.PENDING}
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger
              value="CONFIRMED"
              className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold capitalize cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
            >
              {STATUS_DOTS.PROCESSING}
              Confirmed ({confirmedCount})
            </TabsTrigger>
            <TabsTrigger
              value="DELIVERED"
              className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold capitalize cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
            >
              {STATUS_DOTS.DELIVERED}
              Delivered ({deliveredCount})
            </TabsTrigger>
            <TabsTrigger
              value="CANCELLED"
              className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold capitalize cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
            >
              {STATUS_DOTS.CANCELLED}
              Cancelled ({cancelledCount})
            </TabsTrigger>
            <TabsTrigger
              value="RETURNED"
              className="shrink-0 rounded-full px-3.5 h-7 text-xs font-semibold capitalize cursor-pointer transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
            >
              {STATUS_DOTS.REFUNDED}
              Returned ({returnedCount})
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-slate-50 dark:bg-muted/40 border-none shadow-none text-xs font-semibold"
            />
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {(statusFilter !== "ALL" || search !== "" || dateRange !== undefined) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("ALL");
                setSearch("");
                setDateRange(undefined);
              }}
              className="shrink-0 gap-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-none"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear filter
            </Button>
          )}
          {(statusFilter === "PENDING" || statusFilter === "TODAY") &&
            selectedOrders.length > 0 && (
              <Button
                type="button"
                onClick={handleBulkBook}
                disabled={isBulkBooking}
                className="gap-1.5 shrink-0 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
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
              className="rounded-full gap-1 shrink-0 text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
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
              className="rounded-full gap-1 shrink-0 text-xs font-semibold"
            >
              {bulkDeleteOrders.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash className="h-3.5 w-3.5" />
              )}
              Delete Selected ({selectedOrders.length})
            </Button>
          )}
          {selectedOrders.filter(isTrackable).length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const tracked = selectedOrders.filter(isTrackable);
                syncBatch.mutate(tracked.map((o) => o.id));
              }}
              disabled={syncBatch.isPending}
              className="rounded-full gap-1 shrink-0 text-xs font-semibold border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
            >
              {syncBatch.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync Tracked (
              {selectedOrders.filter(isTrackable).length})
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered || []}
            onRowClick={openOrderDetails}
            actionSlot={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshAllSteadfast}
                disabled={isRefetchingSteadfast}
                className="rounded-full gap-1.5 shrink-0 text-xs font-semibold border bg-slate-50 dark:bg-muted/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                title="Re-fetch Steadfast Status"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isRefetchingSteadfast && "animate-spin")}
                />
                <span>Refresh Steadfast</span>
              </Button>
            }
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            columnVisibility={{
              orderNumber: false,
              reference: false,
              trackingNumber: false,
            }}
          />
        )}
      </div>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => {
          setSelectedOrder(null);
          setShowAllOrderItems(false);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Order Details - {selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <p className="text-slate-600 dark:text-slate-400">{selectedOrder.shippingAddress}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Payment Information</h3>
                    <div className="text-sm space-y-0.5">
                      <p><span className="text-muted-foreground">Method:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></p>
                      <p><span className="text-muted-foreground">Status:</span> <span className="font-medium">{selectedOrder.paymentStatus}</span></p>
                      {selectedOrder.payment?.transactionId && (
                        <p className="text-muted-foreground truncate" title={selectedOrder.payment.transactionId}>
                          TxID: {selectedOrder.payment.transactionId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Device & Network Info
                    </h3>
                    <div className="text-sm space-y-1">
                      <p className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <span className="text-muted-foreground font-normal">IP:</span>{" "}
                        <span className="font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{selectedOrder.ipAddress || "N/A"}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-muted-foreground font-normal">OS:</span>{" "}
                        <span className="font-medium">{selectedOrder.deviceOs || "Unknown OS"}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-muted-foreground font-normal">Browser:</span>{" "}
                        <span className="font-medium">{selectedOrder.browserName || "Unknown Browser"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {selectedOrder.trackingNumber && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">Steadfast Tracking: </span>
                      <span className="font-mono">
                        {selectedOrder.trackingNumber}
                      </span>
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
              </div>

              <div>
                <h3 className="font-semibold mb-4">
                  Order Items ({selectedOrder.items.length})
                </h3>
                <div className="space-y-4">
                  {(showAllOrderItems
                    ? selectedOrder.items
                    : selectedOrder.items.slice(0, 1)
                  ).map((item) => (
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
                          className="rounded-lg border w-16 h-12 sm:w-[120px] sm:h-[80px] object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={item.product.name}>{item.product.name}</p>
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

              {selectedOrder.items.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => setShowAllOrderItems((prev) => !prev)}
                >
                  {showAllOrderItems ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show {selectedOrder.items.length - 1} more{" "}
                      {selectedOrder.items.length - 1 === 1 ? "item" : "items"}
                    </>
                  )}
                </Button>
              )}

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
                {(selectedOrder.refundedAmount ?? 0) > 0 && (
                  <>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>
                        Refunded
                        {selectedOrder.refundReason
                          ? ` — ${selectedOrder.refundReason}`
                          : ""}
                        :
                      </span>
                      <span>
                        -{formatAmount(selectedOrder.refundedAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t">
                      <span>Net received:</span>
                      <span>
                        {formatAmount(
                          selectedOrder.totalAmount -
                            (selectedOrder.refundedAmount ?? 0),
                        )}
                      </span>
                    </div>
                  </>
                )}
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

              {selectedOrder && (() => {
                const target = selectedOrder as ShippingOrder;
                const orderIsCancelled = isCancelled(target);
                const orderIsReturned = isReturned(target);
                const orderIsDelivered = isDelivered(target);

                const canCancel =
                  !orderIsCancelled && !orderIsReturned && !orderIsDelivered;

                const canRefund =
                  orderIsDelivered &&
                  (target.refundedAmount ?? 0) < target.totalAmount;

                if (!canCancel && !canRefund) return null;

                return (
                  <div className="flex gap-2 pt-2">
                    {canCancel && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-950/40"
                        onClick={() => {
                          setSelectedOrder(null);
                          setShowAllOrderItems(false);
                          setCancelTarget(target);
                        }}
                      >
                        <Ban className="h-4 w-4" />
                        Cancel Order
                      </Button>
                    )}
                    {canRefund && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        onClick={() => {
                          setSelectedOrder(null);
                          setShowAllOrderItems(false);
                          openRefundDialog(target);
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        {(target.refundedAmount ?? 0) > 0
                          ? "Refund More"
                          : "Refund Order"}
                      </Button>
                    )}
                  </div>
                );
              })()}
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
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Order"
        description={`Cancel order ${cancelTarget?.orderNumber ?? ""}? All items will be restocked to inventory. This action cannot be undone.`}
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
            {profitBreakdownOrder &&
              (() => {
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
                            <TableHead className="font-medium h-10">
                              Product
                            </TableHead>
                            <TableHead className="text-right font-medium h-10">
                              Qty
                            </TableHead>
                            <TableHead className="text-right font-medium h-10">
                              Revenue
                            </TableHead>
                            <TableHead className="text-right font-medium h-10">
                              Unit Cost
                            </TableHead>
                            <TableHead className="text-right font-medium h-10">
                              Profit
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => {
                            const revenue = item.price * item.quantity;
                            const cost = (item.costPrice ?? 0) * item.quantity;
                            const itemProfit = revenue - cost;
                            const productImage =
                              item.images?.[0] || item.product.images?.[0];
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
                                        <span className="text-xs text-muted-foreground">
                                          No img
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex flex-col max-w-[220px] sm:max-w-[300px]">
                                      <span
                                        className="font-medium leading-tight truncate"
                                        title={item.product.name}
                                      >
                                        {item.product.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                        {item.size ? `Size: ${item.size}` : ""}
                                        {item.size && item.color ? " | " : ""}
                                        {item.color
                                          ? `Color: ${item.color}`
                                          : ""}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right py-4 align-middle tabular-nums">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right py-4 align-middle tabular-nums">
                                  {formatAmount(revenue)}
                                </TableCell>
                                <TableCell className="text-right py-4 align-middle tabular-nums text-red-600 dark:text-red-400">
                                  {item.costPrice != null
                                    ? formatAmount(item.costPrice)
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right py-4 align-middle">
                                  <span
                                    className={cn(
                                      "font-semibold tabular-nums",
                                      itemProfit >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400",
                                    )}
                                  >
                                    {itemProfit >= 0 ? "+" : ""}
                                    {formatAmount(itemProfit)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableFooter className="bg-muted/10 border-t-2 border-border">
                          <TableRow className="hover:bg-transparent border-0">
                            <TableCell
                              colSpan={4}
                              className="text-right font-medium text-muted-foreground pt-6"
                            >
                              Subtotal (Profit)
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium pt-6">
                              <span
                                className={cn(
                                  itemsRevenue - itemsCost >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400",
                                )}
                              >
                                {itemsRevenue - itemsCost >= 0 ? "+" : ""}
                                {formatAmount(itemsRevenue - itemsCost)}
                              </span>
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent border-0">
                            <TableCell
                              colSpan={4}
                              className="text-right font-medium text-muted-foreground pb-4"
                            >
                              Shipping Cost
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium text-red-600 dark:text-red-400 pb-4">
                              -{formatAmount(shippingCost)}
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent border-t bg-muted/30">
                            <TableCell
                              colSpan={4}
                              className="text-right font-bold text-base py-4"
                            >
                              Net Profit
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <span
                                className={cn(
                                  "text-lg font-bold tracking-tight tabular-nums",
                                  profit >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400",
                                )}
                              >
                                {profit >= 0 ? "+" : ""}
                                {formatAmount(profit)}
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

      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Refund Order</DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-mono font-medium">
                    {refundTarget.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order total</span>
                  <span>{formatAmount(refundTarget.totalAmount)}</span>
                </div>
                {(refundTarget.refundedAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Already refunded</span>
                    <span>-{formatAmount(refundTarget.refundedAmount ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>Refundable now</span>
                  <span>{formatAmount(refundRemaining(refundTarget))}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={refundMode === "full" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setRefundMode("full");
                    setRefundAmount(refundRemaining(refundTarget).toString());
                  }}
                >
                  Full refund
                </Button>
                <Button
                  type="button"
                  variant={refundMode === "partial" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRefundMode("partial")}
                >
                  Partial
                </Button>
              </div>

              {refundMode === "partial" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Refund amount ({currencySymbol})
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    max={refundRemaining(refundTarget)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason (optional)</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer returned the item"
                  rows={2}
                  maxLength={500}
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={refundRestock}
                  onCheckedChange={(v) => setRefundRestock(v === true)}
                />
                <span>
                  Restock items
                  <span className="text-muted-foreground">
                    {" "}
                    (applied when the order becomes fully refunded)
                  </span>
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setRefundTarget(null)}
                  disabled={refundOrder.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRefund}
                  disabled={refundOrder.isPending}
                  className="gap-1.5"
                >
                  {refundOrder.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Process Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OrderLogDetailsDialog
        order={logDetailsOrder}
        open={!!logDetailsOrder}
        onOpenChange={(open) => !open && setLogDetailsOrder(null)}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-full" />
          <div className="h-64 w-full bg-muted animate-pulse rounded-3xl" />
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}

function OrderLogDetailsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: ShippingOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: logsData, isLoading } = useActivityLogs(
    order && open
      ? { search: order.orderNumber, orderId: order.id, limit: "50" }
      : undefined
  );

  if (!order) return null;

  const logs = logsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[580px] max-h-[85vh] flex flex-col p-6 rounded-3xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Activity Logs — Order #{order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-2 flex flex-col">
          {isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-muted-foreground text-xs font-medium space-y-1 text-center">
              <p>No activity logs recorded for order #{order.orderNumber} yet.</p>
              <p className="text-[11px] text-slate-400">Activity logs are captured automatically whenever orders are created or updated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/30 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {log.action}
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        By{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {log.userName}
                        </span>{" "}
                        ({log.userEmail})
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          log.status < 300
                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                            : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                        )}
                      >
                        {log.method} {log.status}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  {log.targetName && (
                    <div className="text-slate-600 dark:text-slate-300 text-xs bg-white dark:bg-card px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800 inline-block font-mono">
                      Target: {log.targetName}
                    </div>
                  )}

                  {Array.isArray(log.changes) && log.changes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        Recorded Changes:
                      </p>
                      <div className="space-y-1">
                        {log.changes.map((change: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-card/50 px-2 py-1 rounded-md"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {change.label}:
                            </span>
                            {change.from && (
                              <span className="line-through text-red-500/80">
                                {change.from}
                              </span>
                            )}
                            {change.from && change.to && <span>&rarr;</span>}
                            {change.to && (
                              <span className="text-green-600 dark:text-green-400 font-bold">
                                {change.to}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
