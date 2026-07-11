import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import { RolesClient } from "./roles-client";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export default async function RolesPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, PERMISSIONS.MANAGE_ROLES)) {
    redirect("/dashboard");
  }

  return <RolesClient />;
}
