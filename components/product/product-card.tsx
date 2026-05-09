"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { useWishlistToggle } from "@/lib/helpers";
import { useCurrency } from "@/hooks/use-currency";

interface ProductCardProps {
  product: {
    id: string;
    images: string[];
    name: string;
    category: string;
    price: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { handleWishlistToggle, isAdding, isRemoving, isInWishlist } =
    useWishlistToggle({
      productId: product.id,
    });
  const { formatAmount } = useCurrency();

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="relative rounded-lg overflow-hidden bg-secondary aspect-[3/4] product-card-hover">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              aria-label="Add to cart"
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              size="icon"
              variant="secondary"
              disabled={isAdding || isRemoving}
              onClick={handleWishlistToggle}
              aria-label="Toggle wishlist"
            >
              <Heart
                className={`h-4 w-4 ${
                  isInWishlist ? "fill-red-500  text-red-500" : "stroke-current"
                }`}
              />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        {product.category && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {product.category}
          </p>
        )}
        <h1 className="font-medium">{product.name}</h1>
        <p className="font-medium">{formatAmount(product.price)}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
