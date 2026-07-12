import SignInCard from "@/features/auth/components/sign-in-card";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import React from "react";

async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    const hasDashboardAccess =
      user.role === "ADMIN" ||
      user.role === "MODERATOR" ||
      (user.permissions && user.permissions.length > 0);

    redirect(hasDashboardAccess ? "/dashboard" : "/");
  }

  return (
    <React.Suspense fallback={null}>
      <SignInCard />
    </React.Suspense>
  );
}

export default SignInPage;
