import React from "react";
import ProductsClientLoader from "./products-client-loader";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";

async function ProductPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <ProductsClientLoader />;
}

export default ProductPage;
