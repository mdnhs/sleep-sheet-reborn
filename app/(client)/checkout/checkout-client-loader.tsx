"use client";

import dynamic from "next/dynamic";

const CheckoutClient = dynamic(() => import("./checkout-client"), {
  ssr: false,
});

export default function CheckoutClientLoader() {
  return <CheckoutClient />;
}
