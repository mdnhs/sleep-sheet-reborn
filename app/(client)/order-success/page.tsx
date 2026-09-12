"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, ShoppingBag, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/use-language";
import { useWebsiteSettings } from "@/hooks/use-website-settings";
import { trackEvent } from "@/lib/traffic-tracker";
import { trackGtmPurchase, splitFullName } from "@/lib/gtm";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product: { id: string; name: string; images?: string[] };
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  createdAt: string;
  paymentMethod: string;
  guestName?: string | null;
  guestPhone?: string | null;
  shippingAddress: string;
  items: OrderItem[];
}

function OrderSuccessContent() {
  const router = useRouter();
  const [orderId] = useQueryState("orderId");
  const [phone] = useQueryState("phone");
  const { t, language } = useLanguage();
  const { siteName, logoUrl, footerPhone } = useWebsiteSettings();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        setOrder(data.order);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, router]);

  // NOTE: The Meta Pixel Purchase event is intentionally NOT fired here.
  // Purchase is tracked earlier in the funnel (on the checkout page) plus
  // server-side via the Conversions API at order creation, so firing it again
  // on this success page double-counted the conversion in Meta.
  // Here we fire Google Analytics / GTM / Google Ads standard ecommerce `purchase`
  // with deduplication guard so it reliably captures all items and order totals.
  useEffect(() => {
    if (!order || !orderId) return;

    const { first_name, last_name } = splitFullName(order.guestName);
    // Track standard GA4 & Google Ads Ecommerce purchase event with Enhanced Conversions
    trackGtmPurchase({
      transaction_id: order.orderNumber || order.id,
      order_id: order.id,
      value: order.totalAmount,
      currency: "BDT",
      shipping: order.shippingCost,
      tax: 0,
      user_data: {
        phone_number: order.guestPhone || undefined,
        address: {
          first_name,
          last_name,
          street: order.shippingAddress,
          country: "BD",
        },
      },
      items: order.items.map((item, idx) => ({
        item_id: item.product?.id || item.id,
        item_name: item.product?.name || "Product",
        price: item.price,
        quantity: item.quantity,
        item_variant: [item.size, item.color].filter(Boolean).join(" / ") || undefined,
        index: idx + 1,
      })),
    });

    const orderGuardKey = `traffic_order_tracked_${orderId}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(orderGuardKey)) {
      trackEvent("order_complete", `/order-success?orderId=${orderId}`, orderId, {
        orderId,
        totalAmount: order.totalAmount,
      });
      sessionStorage.setItem(orderGuardKey, "1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, orderId]);

  const handleDownloadInvoice = async () => {
    if (!order) {
      toast.error("Invoice details not found.");
      return;
    }
    try {
      // Load the PDF renderer on demand — it is far too heavy to ship in the
      // page bundle for a click-only feature.
      const [{ pdf }, { InvoicePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/features/checkout/components/invoice-pdf"),
      ]);
      const items = order.items.map((item) => ({
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        image: item.product.images?.[0] || null,
      }));
      const placedOrderData = {
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        items,
      };
      const shippingInfoData = {
        fullName: order.guestName || "Customer",
        phone: order.guestPhone || phone || "",
        address: order.shippingAddress,
        shippingZone: "inside_dhaka" as const,
      };
      const doc = (
        <InvoicePDF
          order={placedOrderData}
          shippingInfo={shippingInfoData}
          siteName={siteName}
          logoUrl={logoUrl || ""}
          language={language}
          phoneNumber={footerPhone}
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-lg font-bold text-destructive mb-4">Order not found.</p>
        <Link href="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-16">
      <Card className="bg-background border border-border/40 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-500"></div>
        <CardContent className="flex flex-col items-center justify-center text-center p-6 sm:p-10 pt-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/10 scale-150 animate-ping duration-1000"></div>
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20 relative z-10">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
            {t("thankYou")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-6 leading-relaxed">
            {t("orderSuccessDesc")}
          </p>
          <div className="w-full bg-muted/40 border border-border/40 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("trackPhone")}
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {order.guestPhone || phone || "N/A"}
              </p>
            </div>
            <ShoppingBag className="h-5 w-5 text-muted-foreground/60" />
          </div>

          {/* WhatsApp Direct Order Confirmation */}
          <a
            href={`https://wa.me/${footerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
              `আসসালামু আলাইকুম Sleep Sheet! আমি একটি নতুন অর্ডার করেছি।\n\nঅর্ডার নম্বর: #${order.orderNumber}\nনাম: ${order.guestName || "Customer"}\nমোট টাকা: ৳${order.totalAmount}\nঠিকানা: ${order.shippingAddress}\n\nদয়া করে অর্ডারটি কনফার্ম করুন।`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mb-4"
          >
            <Button className="w-full h-12 rounded-full font-bold text-sm bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {language === "bn" ? "হোয়াটসঅ্যাপে অর্ডার কনফার্ম করুন" : "Confirm Order on WhatsApp"}
            </Button>
          </a>

          <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
            <Link href={`/track-order?phone=${encodeURIComponent(order.guestPhone || phone || "")}`} className="flex-1">
              <Button variant="outline" className="w-full h-11 rounded-full font-bold text-sm border-border/60 hover:bg-muted/40">
                {t("trackMyOrder")}
              </Button>
            </Link>
            <div className="flex-1">
              <Button onClick={handleDownloadInvoice} className="w-full h-11 rounded-full font-bold text-sm bg-foreground text-background hover:bg-foreground/90 shadow-md cursor-pointer">
                {t("downloadInvoice")}
              </Button>
            </div>
          </div>
          <div className="w-full border-t border-border/40 pt-6">
            <Link href="/" className="text-sm font-bold text-foreground/80 hover:text-foreground flex items-center justify-center gap-1">
              {t("continueShopping")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <React.Suspense fallback={null}>
      <OrderSuccessContent />
    </React.Suspense>
  );
}
