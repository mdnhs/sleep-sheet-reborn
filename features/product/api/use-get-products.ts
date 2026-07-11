import { keepPreviousData, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface ProductQueryParams {
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  search?: string;
  limit?: string;
  featured?: string;
  admin?: string;
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

export const useGetInfiniteProducts = (params?: Omit<ProductQueryParams, "page">) => {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await client.api.products.$get({
        query: {
          ...params,
          page: pageParam.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
  });
};
