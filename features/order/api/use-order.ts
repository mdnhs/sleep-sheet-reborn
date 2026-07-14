// hooks/useOrders.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export interface OrderDateRangeFilter {
  from: string;
  to: string;
}

export const useOrders = (search?: string, range?: OrderDateRangeFilter) => {
  return useQuery({
    queryKey: ["orders", search, range],
    queryFn: async () => {
      const response = await client.api.orders.$get({
        query: range ? { search, from: range.from, to: range.to } : { search },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      return data.orders;
    },
    // Keep showing the previous result set while a new filter's query is in
    // flight, instead of flipping isLoading true and swapping out the UI.
    placeholderData: keepPreviousData,
  });
};