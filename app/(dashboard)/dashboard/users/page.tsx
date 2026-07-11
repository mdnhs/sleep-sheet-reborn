import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
    redirect("/dashboard");
  }

  return <UsersClient />;
}
