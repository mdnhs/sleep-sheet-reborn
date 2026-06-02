"use client";

import dynamic from "next/dynamic";

const ProductDetailClient = dynamic(() => import("./product-detail-client"), {
  ssr: false,
});

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
