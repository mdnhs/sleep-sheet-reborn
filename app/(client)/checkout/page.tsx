import React from "react";
import CheckoutClient from "./checkout-client";
import { getPublicSettings } from "@/lib/prefetch-home";

async function CheckoutPage() {
  const settings = await getPublicSettings().catch(() => null);
  return <CheckoutClient initialSettings={settings} />;
}

export default CheckoutPage;
