import { Metadata } from "next";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import { ActivityClient } from "./activity-client";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Activity Log - Dashboard",
  description: "Audit trail of all dashboard user actions",
};

export default async function ActivityPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, PERMISSIONS.VIEW_ACTIVITY_LOGS)) {
    redirect("/dashboard");
  }

  return <ActivityClient />;
}
