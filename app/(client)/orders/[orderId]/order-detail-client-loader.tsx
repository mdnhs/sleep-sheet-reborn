"use client";

import dynamic from "next/dynamic";

const OrderDetailClient = dynamic(() => import("./order-detail-client"), {
  ssr: false,
});

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
