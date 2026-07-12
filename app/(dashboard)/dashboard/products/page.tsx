import React from "react";
import ProductsClientPage from "./client";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

async function ProductPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS))) {
    redirect("/");
  }

  return <ProductsClientPage />;
}

export default ProductPage;
