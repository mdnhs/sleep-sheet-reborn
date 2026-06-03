import { client } from "@/lib/rpc";
import { WishListResponse, ParsedWishListData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useCurrent } from "@/features/auth/api/use-current";

export const useWishlist = () => {
  // Only logged-in users have a wishlist. Gating avoids guest requests that
  // would 403 and (without this) get retried, multiplying server calls.
  const { data: user } = useCurrent();

  return useQuery<ParsedWishListData>({
    queryKey: ["wishlist"],
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ParsedWishListData> => {
      const response = await client.api.wishlist.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      const json = (await response.json()) as WishListResponse;

      if (!json.success) {
        throw new Error(json.error || "Unknown error fetching wishlist");
      }

      return json.data;
    },
  });
};
