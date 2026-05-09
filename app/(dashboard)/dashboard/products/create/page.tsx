import React from "react";

import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import AddProductClient from "./create-product-client";

async function AddProduct() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <AddProductClient />;
}

export default AddProduct;
