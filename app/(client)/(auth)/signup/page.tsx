import SignUpClientLoader from "./sign-up-client-loader";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import React from "react";

async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  return <SignUpClientLoader />;
}

export default SignUpPage;
