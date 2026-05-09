import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    onSuccess: () => {
      toast.success("Product removed from wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
