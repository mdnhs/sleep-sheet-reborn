import { getCurrentUser } from "@/lib/is-authenticated";
import React from "react";

import { redirect } from "next/navigation";
import AccountClientLoader from "./account-client-loader";

async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signup");
  }
  return <AccountClientLoader name={user.name} />;
}

export default AccountPage;
