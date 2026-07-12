import React from "react";

import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import AddProductClient from "./create-product-client";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

async function AddProduct() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR" && !hasPermission(user, PERMISSIONS.MANAGE_PRODUCTS))) {
    redirect("/");
  }

  return (
    <React.Suspense fallback={null}>
      <AddProductClient />
    </React.Suspense>
  );
}

export default AddProduct;
