"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, Calendar, Phone, ArrowLeft, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useWebsiteSettings } from "@/hooks/use-website-settings";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product: { id: string; name: string; images: string[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  shippingAddress: string;
  guestPhone?: string | null;
  createdAt: string;
  guestName?: string | null;
  items: OrderItem[];
  trackingNumber?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200/30" },
  PROCESSING: { label: "Processing", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200/30" },
  SHIPPED: { label: "Shipped", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200/30" },
  DELIVERED: { label: "Delivered", color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200/30" },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200/30" },
  REFUNDED: { label: "Refunded", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200/30" },
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phoneParam = searchParams.get("phone");
  const { t, language } = useLanguage();

  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const { formatAmount } = useCurrency();
  const { siteName, logoUrl } = useWebsiteSettings();

  const performSearch = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    setError("");
    setSearched(false);
    setCurrentPage(1);

    try {
      const res = await fetch(`/api/orders/by-phone?phone=${encodeURIComponent(phoneNumber.trim())}`);
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

  useEffect(() => {
    if (phoneParam) {
      setPhone(phoneParam);
      performSearch(phoneParam);
    }
  }, [phoneParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    router.push(`/track-order?phone=${encodeURIComponent(phone.trim())}`);
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      // Load the PDF renderer on demand — it is far too heavy to ship in the
      // page bundle for a click-only feature.
      const [{ pdf }, { InvoicePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/features/checkout/components/invoice-pdf"),
      ]);
      const items = order.items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size || undefined,
        color: item.color || undefined,
        image: item.product.images?.[0] || undefined,
      }));
      const placedOrderData = {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        items,
        trackingNumber: order.trackingNumber,
      };
      const shippingInfoData = {
        fullName: order.guestName || "Customer",
        phone: order.guestPhone || phone || "",
        address: order.shippingAddress,
        shippingZone: "inside_dhaka" as const,
        notes: (order as any).note,
      };
      const doc = (
        <InvoicePDF
          order={placedOrderData}
          shippingInfo={shippingInfoData}
          siteName={siteName}
          logoUrl={logoUrl || ""}
          language={language}
        />
      );
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="w-full bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto px-4 py-8 sm:py-16 max-w-5xl">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-3.5 w-3.5" />
        Back
      </Button>

      <Card className="bg-background/80 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl overflow-hidden mb-8 relative max-w-2xl mx-auto">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60"></div>
        <CardHeader className="text-center pb-4 pt-8">
          <div className="relative mx-auto mb-6 w-fit mt-2">
            <div className="absolute inset-0 rounded-full bg-primary/10 scale-150 animate-ping duration-1000"></div>
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center relative z-10 text-primary">
              <Package className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {t("trackYourOrder")}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto mt-1.5">
            {t("trackYourOrderDesc")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-8 pt-2">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Input
                type="tel"
                placeholder={t("phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 bg-background/50 backdrop-blur-sm border-border/50 rounded-2xl px-5 pl-12 text-base focus-visible:ring-2 focus-visible:ring-primary/50 shadow-inner"
                required
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
            </div>
            <Button type="submit" disabled={loading} className="h-14 px-8 rounded-2xl font-bold text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-all">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  {t("searching")}
                </div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {t("search")}
                </>
              )}
            </Button>
          </form>

          {error && (
            <p className="text-destructive text-sm font-medium text-center mt-4">{error}</p>
          )}
        </CardContent>
      </Card>

      {searched && !error && orders.length === 0 && (
        <Card className="bg-background border border-border/45 rounded-3xl p-8 text-center text-muted-foreground shadow-sm max-w-2xl mx-auto">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30 text-foreground" />
          <p className="text-sm font-medium">{t("noOrdersFound")}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => {
          const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: "" };
          return (
            <Card key={order.id} className="bg-background/90 backdrop-blur-sm border border-border/40 rounded-3xl p-5 sm:p-7 shadow-md hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {t("orderNumberLabel2")}
                    </span>
                    <span className="text-sm font-black text-foreground">{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(order.createdAt).toLocaleString("en-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              <div className="space-y-3 py-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground font-medium">
                        <span>{t("qty")}: {item.quantity}</span>
                        {item.size && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                            <span>{item.size}</span>
                          </>
                        )}
                        {item.color && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                            <span>{item.color}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-foreground shrink-0">{formatAmount(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-2 border-t border-border/40 gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {order.paymentMethod === "COD" ? t("cashOnDelivery") : t("cardPayment")}
                  </span>
                  <span className="text-lg font-black text-foreground tracking-tight">{formatAmount(order.totalAmount)}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownloadInvoice(order)}
                  className="rounded-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  {t("downloadInvoice")}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {Math.ceil(orders.length / itemsPerPage) > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-full"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {Math.ceil(orders.length / itemsPerPage)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(Math.ceil(orders.length / itemsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
            className="rounded-full"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <React.Suspense fallback={null}>
      <TrackOrderContent />
    </React.Suspense>
  );
}
