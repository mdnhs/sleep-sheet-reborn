"use client";

import dynamic from "next/dynamic";

const ProductsClientPage = dynamic(() => import("./client"), { ssr: false });

export default function ProductsClientLoader() {
  return <ProductsClientPage />;
}
