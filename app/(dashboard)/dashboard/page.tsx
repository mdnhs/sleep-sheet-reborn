import React from "react";
import DashboardClientLoader from "./dashboard-client-loader";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";

async function DashBoardPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <DashboardClientLoader />;
}

export default DashBoardPage;
