"use client";

import dynamic from "next/dynamic";

const DashBoardClientPage = dynamic(() => import("./client"), { ssr: false });

export default function DashboardClientLoader() {
  return <DashBoardClientPage />;
}
