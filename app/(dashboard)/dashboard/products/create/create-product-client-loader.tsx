"use client";

import dynamic from "next/dynamic";

const AddProductClient = dynamic(() => import("./create-product-client"), {
  ssr: false,
});

export default function CreateProductClientLoader() {
  return <AddProductClient />;
}
