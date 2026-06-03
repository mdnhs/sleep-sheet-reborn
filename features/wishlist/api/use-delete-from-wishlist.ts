import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ParsedWishListData } from "@/lib/types";

interface DeleteWishlistProps {
  productId: string;
}

export const useDeleteFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId }: DeleteWishlistProps) => {
      const response = await client.api.wishlist.$delete({
        json: { productId },
      });

      if (!response.ok) {
        throw new Error( "Failed to delete from wishlist");
      }

      return response.json();
    },
    onSuccess: (_data, { productId }) => {
      toast.success("Product removed from wishlist");
      // Drop the item from the cache directly — no extra GET. Removal is
      // lossless, so refetching the whole wishlist is unnecessary.
      queryClient.setQueryData<ParsedWishListData>(["wishlist"], (prev) =>
        prev
          ? { ...prev, items: prev.items.filter((i) => i.product.id !== productId) }
          : prev,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
