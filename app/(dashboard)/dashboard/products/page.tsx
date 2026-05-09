import React from "react";
import ProductsClientPage from "./client";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";

async function ProductPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <ProductsClientPage />;
}

export default ProductPage;
