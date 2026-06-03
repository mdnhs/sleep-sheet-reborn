import SignInClientLoader from "./sign-in-client-loader";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import React from "react";

async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(
      user.role === "ADMIN" || user.role === "MODERATOR" ? "/dashboard" : "/"
    );
  }

  return <SignInClientLoader />;
}

export default SignInPage;
