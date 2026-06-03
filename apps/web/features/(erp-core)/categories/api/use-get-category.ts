import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

type FeaturedCategoriesResponse = {
  success: boolean;
  categories: Array<{
    label: string;
    value: string;
    image: string;
  }>;
};

export const useGetCategory = () => {
  return useQuery<FeaturedCategoriesResponse>({
    queryKey: ["category"],
    queryFn: async () => {
      const response = await client.api.categories["category"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch category");
      }

      return response.json() as Promise<FeaturedCategoriesResponse>;
    },
  });
};
