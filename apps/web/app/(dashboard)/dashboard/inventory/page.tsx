import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/is-authenticated";
import InventoryClientLoader from "./inventory-client-loader";

async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <InventoryClientLoader />;
}

export default InventoryPage;
