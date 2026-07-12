import React from "react";
import DashBoardClientPage from "./client";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";

async function DashBoardPage() {
  const user = await getCurrentUser();
  const hasDashboardAccess =
    user && (
      user.role === "ADMIN" ||
      user.role === "MODERATOR" ||
      (user.permissions && user.permissions.length > 0)
    );

  if (!hasDashboardAccess) {
    redirect("/");
  }

  return <DashBoardClientPage />;
}

export default DashBoardPage;
