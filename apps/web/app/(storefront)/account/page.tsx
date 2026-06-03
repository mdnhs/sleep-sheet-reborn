import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-server";
import AccountClientLoader from "./account-client-loader";

async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/signin");
  return <AccountClientLoader name={session.user.name} />;
}

export default AccountPage;
