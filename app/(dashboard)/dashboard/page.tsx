import React from "react";
import DashBoardClientPage from "./client";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";

async function DashBoardPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return <DashBoardClientPage />;
}

export default DashBoardPage;
