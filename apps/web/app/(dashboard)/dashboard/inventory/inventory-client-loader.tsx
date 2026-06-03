"use client";

import dynamic from "next/dynamic";

const InventoryClient = dynamic(() => import("./inventory-client"), { ssr: false });

export default function InventoryClientLoader() {
  return <InventoryClient />;
}
