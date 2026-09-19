import { Suspense } from "react";
import { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/is-authenticated";
import { redirect } from "next/navigation";
import { FraudCheckerClient } from "./fraud-checker-client";
import { can } from "@/lib/permissions";
import { getMyPlan } from "@/lib/bdcourier";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "ফ্রড চেকার - Dashboard",
  description: "পার্সেল পাঠানোর আগে কাস্টমারের কুরিয়ার ডেলিভারি হিস্ট্রি যাচাই করুন",
};

function FraudCheckerSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-3xl" />
    </div>
  );
}

export default async function FraudCheckerPage() {
  const user = await getCurrentUser();

  if (!user || !can(user, "orders", "read")) {
    redirect("/dashboard");
  }

  // Server-render the plan so the "আমার প্ল্যান" tab paints filled in instead
  // of flashing a skeleton. Calls the lib directly — fetching our own API
  // route from here would be a pointless HTTP round trip.
  //
  // Only the plan: a fraud check is billed per call, so it must stay on the
  // admin's click and never fire from a page render.
  //
  // prefetchQuery never throws, and dehydrate() drops failed queries, so a
  // missing API key or a slow BD Courier just leaves the client to fetch and
  // show its own error. Hence the short timeout — this runs inside the page
  // render, and a hanging request would hold the whole page.
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["fraud-check-plan"],
    queryFn: () => getMyPlan(6_000),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<FraudCheckerSkeleton />}>
        <FraudCheckerClient />
      </Suspense>
    </HydrationBoundary>
  );
}
