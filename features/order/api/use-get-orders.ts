import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import type { Order } from "@/features/order/types";

type OrdersResponse = {
  orders: Order[];
};

export const useGetOrders = () => {
  return useQuery<OrdersResponse>({
    queryKey: ["orders",],
    queryFn: async () => {
      const response = await client.api.orders.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      return response.json() as Promise<OrdersResponse>;
    },
  });
};
