"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const useCurrent = () => {
  const query = useQuery({
    queryKey: ["current"],
    queryFn: async () => {
      const res = await authClient.getSession();
      return res?.data?.user ?? null;
    },
  });
  return query;
};
