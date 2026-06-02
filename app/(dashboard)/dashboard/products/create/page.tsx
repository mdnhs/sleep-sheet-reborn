import React from "react";

import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import CreateProductClientLoader from "./create-product-client-loader";

async function AddProduct() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <CreateProductClientLoader />;
}

export default AddProduct;
