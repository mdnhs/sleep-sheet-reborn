// hooks/useOrders.ts
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useOrders = (search?: string) => {
  return useQuery({
    queryKey: ["orders", search],
    queryFn: async () => {
      const response = await client.api.orders.$get({ query: { search } });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      return data.orders;
    },
  });
};