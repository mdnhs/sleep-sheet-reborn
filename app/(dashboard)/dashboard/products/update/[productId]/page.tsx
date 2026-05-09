import React from "react";
import UpdateProductClient from "./update-product-client";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";

async function UpdateProduct() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <UpdateProductClient />;
}

export default UpdateProduct;
