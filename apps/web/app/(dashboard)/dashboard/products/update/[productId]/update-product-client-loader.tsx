"use client";

import dynamic from "next/dynamic";

const UpdateProductClient = dynamic(() => import("./update-product-client"), {
  ssr: false,
});

export default function UpdateProductClientLoader() {
  return <UpdateProductClient />;
}
