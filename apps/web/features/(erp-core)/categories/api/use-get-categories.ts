import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export type CategoryOption = {
  id: string;
  label: string;
  value: string;
  parentId: string | null;
};

export const useGetCategories = () => {
  return useQuery<CategoryOption[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await client.api.categories.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      return response.json() as Promise<CategoryOption[]>;
    },
  });
};
