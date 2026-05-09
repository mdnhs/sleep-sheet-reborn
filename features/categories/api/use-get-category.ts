import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";


export const useGetCategory = () => {
  return useQuery({
    queryKey: ["category"],
    queryFn: async () => {
      const response = await client.api.categories["category"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch category");
      }

      return response.json();
    },
  });
};
