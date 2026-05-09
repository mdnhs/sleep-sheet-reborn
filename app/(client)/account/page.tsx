import { getCurrentUser } from "@/lib/is-authenticated";
import React from "react";

import { redirect } from "next/navigation";
import AccountClientPage from "./account-client";

async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signup");
  }
  return <AccountClientPage name={user.name} />;
}

export default AccountPage;
