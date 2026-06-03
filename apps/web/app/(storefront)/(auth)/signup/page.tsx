import { redirect } from "next/navigation";
import React from "react";
import { getCurrentSession } from "@/lib/auth-server";
import SignUpClientLoader from "./sign-up-client-loader";

async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");
  return <SignUpClientLoader />;
}

export default SignUpPage;
