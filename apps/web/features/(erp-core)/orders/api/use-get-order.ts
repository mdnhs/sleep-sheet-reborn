import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import type { Order } from "@/features/(erp-core)/orders/types";

type AccountOrdersResponse = {
  order: Order[];
};

export const useGetOrder = () => {
  return useQuery<AccountOrdersResponse>({
    queryKey: ["order",],
    queryFn: async () => {
      const response = await client.api.orders["order"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      return response.json() as Promise<AccountOrdersResponse>;
    },
  });
};
