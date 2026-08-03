import React, { Suspense } from "react";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";

function UsersSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersClient />
    </Suspense>
  );
}
