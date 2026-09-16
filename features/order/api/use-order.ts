// hooks/useOrders.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export interface OrderDateRangeFilter {
  from: string;
  to: string;
}

export const useOrders = (
  search?: string,
  range?: OrderDateRangeFilter,
  options?: { enabled?: boolean; status?: string }
) => {
  const status = options?.status;
  return useQuery({
    // `status` only narrows what the server sends — the dashboard still runs
    // its own bucket predicates over the result, because those also depend on
    // live courier state the API cannot see. It belongs in the key regardless,
    // since a different status means a different response.
    queryKey: ["orders", search, range, status],
    queryFn: async () => {
      const response = await client.api.orders.$get({
        query: {
          search,
          status,
          ...(range ? { from: range.from, to: range.to } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      return data.orders;
    },
    enabled: options?.enabled ?? true,
    // Keep showing the previous result set while a new filter's query is in
    // flight, instead of flipping isLoading true and swapping out the UI.
    placeholderData: keepPreviousData,
  });
};