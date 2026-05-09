import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface ProductQueryParams {
  category?: string;
  sort?: string;
  price?: string;
  page?: string;
  search?: string;
  limit?: string;
}

export const useGetProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const response = await client.api.products.$get({
        query: params,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      return response.json();
    },
    placeholderData: keepPreviousData,
  });
};
