// hooks/useOrderMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { OrderStatus, PaymentStatus } from "../types";

export const useOrderMutations = () => {
  const queryClient = useQueryClient();

  const updateOrder = useMutation({
    mutationFn: async (data: { 
      id: string; 
      status: OrderStatus; 
      paymentStatus: PaymentStatus 
    }) => {
      const response = await client.api.orders[":id"].$patch({
        param: { id: data.id },
        json: { status: data.status, paymentStatus: data.paymentStatus },
      });
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      await client.api.orders[":id"].$delete({ param: { id } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  return { updateOrder, deleteOrder };
};