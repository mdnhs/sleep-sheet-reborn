"use client";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/cart/state/cart-slice";
import { useWishlistToggle } from "@/lib/helpers";
import { Product } from "@/lib/types";
import { useAppDispatch } from "@/store/hooks";
import { Heart, ShoppingBag, Phone, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";

interface ProductPickerProps {
  product: Product;
}

function ProductPicker({ product }: ProductPickerProps) {
  const isColorAvailable = (product.colors?.length ?? 0) > 0;
  const isSizeAvailable = (product.sizes?.length ?? 0) > 0;
  const isInStock = product.stock > 0;

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { formatAmount } = useCurrency();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  
  const { isInWishlist, isAdding, isRemoving, handleWishlistToggle } =
    useWishlistToggle({ productId: product.id });

  const currentVariant = product.colors?.find(c => c.name === selectedColor);
  const displayPrice = currentVariant?.price || product.price;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling down past the main buttons
      if (window.scrollY > 400) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // components/ProductCard.tsx
  const handleAddToCart = () => {
    if (
      (!selectedSize && isSizeAvailable) ||
      (!selectedColor && isColorAvailable)
    ) {
      toast.error("Please select options before adding to cart");
      return;
    }

    dispatch(
      addToCart({
        productId: product.id,
        quantity: quantity,
        size: selectedSize,
        color: selectedColor,
        guestProduct: {
          id: `guest-${product.id}-${selectedSize}-${selectedColor}-${Date.now()}`,
          productId: product.id,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
          name: product.name,
          price: displayPrice,
          image: product.images[0] ?? "",
          description: product.description,
        },
      })
    );
  };

  const handleBuyNow = () => {
    if (
      (!selectedSize && isSizeAvailable) ||
      (!selectedColor && isColorAvailable)
    ) {
      toast.error("Please select options before proceeding to checkout");
      return;
    }

    dispatch(
      addToCart({
        productId: product.id,
        quantity: quantity,
        size: selectedSize,
        color: selectedColor,
        guestProduct: {
          id: `guest-${product.id}-${selectedSize}-${selectedColor}-${Date.now()}`,
          productId: product.id,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
          name: product.name,
          price: displayPrice,
          image: product.images[0] ?? "",
          description: product.description,
        },
      })
    );

    router.push("/checkout");
  };

  return (
    <>
      {isColorAvailable && (
        <div className="mb-4 lg:mb-6">
          <div className="flex justify-between items-center mb-2 lg:mb-3">
            <h3 className="text-sm text-muted-foreground">Select Color</h3>
            <span className="text-xs font-medium text-foreground">{selectedColor}</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {product.colors?.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.name)}
                className={`px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedColor === color.name
                    ? "bg-foreground text-background"
                    : "bg-secondary/30 text-foreground hover:bg-secondary/60"
                }`}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSizeAvailable && (
        <div className="mb-4 lg:mb-8">
          <div className="flex justify-between items-center mb-2 lg:mb-3">
            <h3 className="text-sm text-muted-foreground">Select Size</h3>
            <span className="text-xs font-medium text-foreground">{selectedSize}</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 lg:px-6 lg:py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedSize === size
                    ? "bg-foreground text-background"
                    : "bg-secondary/30 text-foreground hover:bg-secondary/60"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:gap-4 mb-4 lg:mb-8">
        {/* Top Row: Quantity & Wishlist */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="flex items-center justify-between bg-secondary/30 rounded-full px-2 h-12 lg:h-14 w-28 lg:w-32 shrink-0">
            <button
              className="h-10 w-10 flex items-center justify-center rounded-full text-lg text-foreground hover:bg-background transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="w-8 text-center font-semibold text-sm text-foreground">{quantity}</span>
            <button
              className="h-10 w-10 flex items-center justify-center rounded-full text-lg text-foreground hover:bg-background transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center leading-tight">
            <span className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Price</span>
            <span className="font-bold text-lg lg:text-xl text-foreground">
              {formatAmount(displayPrice * quantity)}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={isAdding || isRemoving}
            className="h-12 w-12 lg:h-14 lg:w-14 shrink-0 rounded-full border-border bg-background hover:bg-secondary/50 transition-colors ml-auto"
            onClick={handleWishlistToggle}
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${
                isInWishlist ? "fill-foreground text-foreground" : "stroke-foreground"
              }`}
            />
          </Button>
        </div>

        {/* Main Actions: Add to Cart & Buy Now */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          <Button
            variant="outline"
            className="h-12 lg:h-14 rounded-full text-sm lg:text-base font-semibold tracking-wide border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
            disabled={!isInStock}
            onClick={handleAddToCart}
          >
            {isInStock ? "Add to Cart" : "Out of Stock"}
          </Button>

          <Button
            className="h-12 lg:h-14 rounded-full text-sm lg:text-base font-semibold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            disabled={!isInStock}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <a 
            href="tel:+8801700000000"
            className="flex items-center justify-center h-12 rounded-full font-medium border border-border bg-background hover:bg-secondary/50 transition-colors text-sm"
          >
            <Phone className="mr-2 h-4 w-4" />
            Phone Call Order
          </a>
          <a 
            href="https://wa.me/8801700000000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center h-12 rounded-full font-medium border border-green-500 text-green-600 hover:bg-green-50 transition-colors text-sm"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp Order
          </a>
        </div>
      </div>

      {/* Smart Sticky Bottom Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border py-3 sm:py-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] transform transition-transform duration-300 z-50 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          <div className="hidden sm:block flex-1 min-w-0 pr-4">
            <p className="font-semibold truncate text-sm text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground font-medium">${displayPrice.toFixed(2)}</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:w-40 h-12 rounded-full font-semibold border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
              disabled={!isInStock}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>

            <Button
              className="flex-1 sm:w-40 h-12 rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              disabled={!isInStock}
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductPicker;
