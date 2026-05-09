import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { Product } from "@/lib/types";

interface UseGetProductProps {
  id: string;
}

export const useGetProduct = ({ id }: UseGetProductProps) => {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await client.api.products[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Product not found");
      }

      const data = await response.json();
      return data.formattedProduct as Product;
    },
    enabled: !!id,
  });
};
