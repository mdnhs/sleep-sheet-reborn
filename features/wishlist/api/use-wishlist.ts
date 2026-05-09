
import { client } from "@/lib/rpc";
import {
  WishListResponse,
  ParsedWishListData,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export const useWishlist = () => {
  return useQuery<ParsedWishListData>({
    queryKey: ["wishlist"],
    queryFn: async (): Promise<ParsedWishListData> => {
      const response = await client.api.wishlist.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      const json = await response.json() as WishListResponse;


      if (!json.success) {
        throw new Error(json.error || "Unknown error fetching wishlist");
      }

      return json.data;
    },
  });
};
