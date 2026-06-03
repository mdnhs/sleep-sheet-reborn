import { redirect } from "next/navigation";
import React from "react";
import { getCurrentSession } from "@/lib/auth-server";
import SignInClientLoader from "./sign-in-client-loader";

async function SignInPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return <SignInClientLoader />;
}

export default SignInPage;
