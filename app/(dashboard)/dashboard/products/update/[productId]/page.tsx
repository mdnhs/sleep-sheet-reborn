import React from "react";
import UpdateProductClientLoader from "./update-product-client-loader";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";

async function UpdateProduct() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <UpdateProductClientLoader />;
}

export default UpdateProduct;
