import { Metadata } from "next";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import { CustomersClient } from "./customers-client";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Customers - Dashboard",
  description: "View and manage your customers",
};

export default async function CustomersPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
    redirect("/dashboard");
  }

  return <CustomersClient />;
}
