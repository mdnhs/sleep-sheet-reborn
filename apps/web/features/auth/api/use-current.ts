"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

// Better Auth additionalFields (phone/address) aren't in the client-inferred
// user type; widen it here so consumers get them.
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  phone?: string | null;
  address?: string | null;
};

export const useCurrent = () => {
  const query = useQuery({
    queryKey: ["current"],
    queryFn: async (): Promise<CurrentUser | null> => {
      const res = await authClient.getSession();
      return (res?.data?.user as CurrentUser | undefined) ?? null;
    },
  });
  return query;
};
