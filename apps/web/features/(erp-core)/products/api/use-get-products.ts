import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export type ProductListItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  tags: string[];
  images: string[];
  category: string;
  categoryLabel: string;
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
};

type ProductsResponse = {
  data: ProductListItem[];
  total: number;
  hasNextPage: boolean;
  totalPages: number;
};

interface ProductQueryParams {
  category?: string;
  sort?: string;
  price?: string;
  page?: string;
  search?: string;
  limit?: string;
}

export const useGetProducts = (params?: ProductQueryParams) => {
  return useQuery<ProductsResponse>({
    queryKey: ["products", params],
    queryFn: async () => {
      const response = await client.api.products.$get({
        query: params,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      return response.json() as Promise<ProductsResponse>;
    },
    placeholderData: keepPreviousData,
  });
};
