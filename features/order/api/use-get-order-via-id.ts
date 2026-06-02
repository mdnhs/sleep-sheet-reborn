import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import type { Order } from "@/features/order/types";

export const useGetOrderByID = (id: string) => {
  return useQuery<{ order: Order & { OrderTimelineEvent: Array<{ id: string; status: string; message: string; createdAt: string }> } }>({
    queryKey: ["order", id],
    queryFn: async () => {
      const response = await client.api.orders[":id"].$get({ param: { id } });
    

      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }

      return response.json() as Promise<{ order: Order & { OrderTimelineEvent: Array<{ id: string; status: string; message: string; createdAt: string }> } }>;
    },
    enabled: !!id, 
  });
};
