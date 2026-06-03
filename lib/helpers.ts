
import { useAddWishList } from "@/features/wishlist/api/use-add-wishlist";
import { useDeleteFromWishlist } from "@/features/wishlist/api/use-delete-from-wishlist";
import { useWishlistContext } from "@/provider/wishlist-provider";

interface UseWishlistToggleProps {
  productId: string;
}

export const useWishlistToggle = ({ productId }: UseWishlistToggleProps) => {
  const { mutate: addToWishlist, isPending: isAdding } = useAddWishList();
  const { mutate: deleteFromWishlist, isPending: isRemoving } = useDeleteFromWishlist();
  // Membership comes from the shared provider — no per-card wishlist fetch.
  const { wishlistIds } = useWishlistContext();
  const isInWishlist = wishlistIds.has(productId);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlist) {
 
      deleteFromWishlist({ productId });
    } else {
      addToWishlist({ productId });
    }
  };

  return {
    handleWishlistToggle,
    isAdding,
    isRemoving,
    isInWishlist,
  };
};
