"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Heart, Star, ChevronUp, ShoppingCart, X, Minus, Plus, Tag, ArrowUpCircle, Zap } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { toast } from "sonner";
import { Product } from "@/lib/types";
import { useWishlistToggle } from "@/lib/helpers";
import { useLanguage } from "@/hooks/use-language";
import { useCartStore } from "@/features/cart/state/use-cart-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePixelTracking } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/traffic-tracker";
import { getOptimizedImageUrl } from "@/lib/utils";

interface ProductCardProps {
  product: Product & {
    discountTag?: string;
  };
  priority?: boolean;
}

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const { t } = useLanguage();
  const { handleWishlistToggle, isAdding, isRemoving, isInWishlist } =
    useWishlistToggle({
      productId: product.id,
    });
  const { formatAmount } = useCurrency();
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();
  const { track } = usePixelTracking();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"cart" | "buy" | null>(null);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.defaultVariantName || product.colors?.[0]?.name || "");
  const [quantity, setQuantity] = useState(1);

  const hasColors = product.colors && product.colors.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasVariants = hasColors || hasSizes;

  const currentVariant = product.colors?.find(c => c.name === selectedColor);
  const displayPrice = currentVariant && (currentVariant.price !== null && currentVariant.price !== undefined)
    ? currentVariant.price
    : product.price;

  const dispatchAddToCart = () => {
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
        image: product.images?.[0] ?? "",
        description: product.description || "",
      },
    });

    track("AddToCart", {
      content_ids: [product.id],
      content_type: "product",
      content_name: product.name,
      value: displayPrice * quantity,
      currency: "BDT",
      quantity,
    });
    trackEvent("add_to_cart", `/shop/${product.id}`, product.name, {
      productId: product.id,
      quantity,
      price: displayPrice,
    });
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      setDialogAction("buy");
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      dispatchAddToCart();
      track("InitiateCheckout", {
        content_ids: [product.id],
        content_type: "product",
        value: displayPrice * quantity,
        currency: "BDT",
        num_items: quantity,
        contents: [{ id: product.id, quantity, item_price: displayPrice }],
      });
      trackEvent("buy_now", `/shop/${product.id}`, product.name, {
        productId: product.id,
        quantity,
        price: displayPrice,
      });
      toast.success("Added to cart successfully");
      router.push("/checkout");
    }
  };

  const handleAddToCartVariant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (hasColors && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    
    dispatchAddToCart();
    toast.success("Added to cart successfully");
    setIsDrawerOpen(false);
  };

  const handleBuyNowVariant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (hasColors && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    
    dispatchAddToCart();
    track("InitiateCheckout", {
      content_ids: [product.id],
      content_type: "product",
      value: displayPrice * quantity,
      currency: "BDT",
      num_items: quantity,
      contents: [{ id: product.id, quantity, item_price: displayPrice }],
    });
    trackEvent("buy_now", `/shop/${product.id}`, product.name, {
      productId: product.id,
      quantity,
      price: displayPrice,
    });
    toast.success("Added to cart successfully");
    setIsDrawerOpen(false);
    router.push("/checkout");
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If it has variants and not fully selected or drawer closed, open drawer
    if (hasVariants && (!isDrawerOpen || (hasSizes && !selectedSize) || (hasColors && !selectedColor))) {
      setDialogAction("cart");
      setIsDrawerOpen(true);
      return;
    }

    dispatchAddToCart();
    toast.success("Added to cart successfully");
    setIsDrawerOpen(false);
  };

  const updateQuantity = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(Math.max(1, quantity + delta));
  };

  return (
    <div className="group relative w-full h-full flex flex-col rounded-3xl bg-white dark:bg-slate-900 p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      
      {/* Product Image */}
      <div
        onClick={() => {
          if (!isDrawerOpen) {
            router.push(`/shop/${product.id}`);
          }
        }}
        className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-[#f4f4f5] dark:bg-slate-800 mb-4 shrink-0 z-0 cursor-pointer"
      >
        <Image
          src={getOptimizedImageUrl(product.images?.[0], 400) || "/placeholder.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          quality={65}
          className={`w-full h-full object-cover transition-all duration-700 ${isDrawerOpen ? 'blur-md scale-110 opacity-40' : 'group-hover:scale-105'}`}
        />
        
        {/* Top actions: Discount tag */}
        <div className="absolute top-3 left-3 flex justify-between items-start z-10 w-[calc(100%-24px)]" onClick={(e) => e.stopPropagation()}>
          {product.discount && product.discount > 0 ? (
            <div className="bg-[#1a1a1a] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="h-3 w-3 text-orange-400" /> {Math.round(product.discount)}% OFF
            </div>
          ) : (
            <div />
          )}

          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlistToggle(e);
            }}
            className="h-10 w-10 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all duration-300 active:scale-95"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 transition-colors ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-400 hover:text-red-500'}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col px-1 flex-1 relative z-10 bg-white dark:bg-slate-900">
        
        {/* Title */}
        <Link href={`/shop/${product.id}`} className="flex-1" onClick={(e) => { if (isDrawerOpen) e.preventDefault(); }}>
          <h3 className="font-medium text-sm sm:text-[15px] text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 mb-2 sm:mb-3">
            {product.name}
          </h3>
        </Link>
        
        {/* Price and Rating Row */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            {product.discount > 0 && (
              <span className="text-sm line-through text-slate-500 dark:text-slate-400 font-medium">
                {formatAmount(displayPrice / (1 - product.discount / 100))}
              </span>
            )}
            <p className="font-bold text-lg sm:text-[20px] text-slate-800 dark:text-slate-200">
              {formatAmount(displayPrice)}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[14px] text-slate-600 dark:text-slate-400 font-medium">
              {product.rating || "4.4"}
            </span>
            <div className="bg-[#f59e0b] p-1 rounded-md">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
            </div>
          </div>
        </div>

        {/* Quantity & Cart Row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          {/* Quantity Selector */}
          <div className="flex-1 flex items-center justify-between bg-[#f4f4f5] dark:bg-slate-800 rounded-xl px-2 h-10 sm:h-12" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <button onClick={(e) => updateQuantity(e, -1)} className="h-full w-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50" disabled={quantity <= 1} aria-label="Decrease quantity">
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">{quantity}</span>
            <button onClick={(e) => updateQuantity(e, 1)} className="h-full w-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" aria-label="Increase quantity">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Quick Add to Cart Button */}
          <button
            onClick={handleQuickAdd}
            className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#2d2d2d] hover:bg-[#1a1a1a] rounded-xl flex items-center justify-center text-white transition-colors active:scale-95"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Dialog for Variants */}
      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("selectOption")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {hasSizes && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Size</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(size); }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedSize === size 
                          ? 'border-primary bg-primary text-white shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasColors && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Variant</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors?.map((color) => (
                    <button
                      key={color.name}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(color.name); }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedColor === color.name 
                          ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {color.name} ({formatAmount(color.price !== null ? color.price : product.price)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full mt-4">
            {dialogAction === "cart" && (
              <button
                onClick={handleAddToCartVariant}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-[#f8f9fa] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3 sm:py-3.5 px-2 sm:px-3 rounded-[14px] font-bold text-xs sm:text-sm transition-all active:scale-[0.98]"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t("cart")}
              </button>
            )}
            {dialogAction === "buy" && (
              <button
                onClick={handleBuyNowVariant}
                className="animate-cta-wiggle flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-3 sm:py-3.5 px-2 sm:px-3 rounded-[14px] font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98]"
              >
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" />
                {t("buyNow")}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Button */}
      <div className="relative z-40 px-1 shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={handleActionClick}
          className="animate-cta-wiggle w-full flex items-center justify-between bg-primary text-primary-foreground hover:bg-primary/90 py-3 sm:py-3.5 px-4 sm:px-5 rounded-[14px] font-medium text-xs sm:text-[14px] transition-all active:scale-[0.98]"
        >
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" /> {t("buyNow")}</span>
          <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 opacity-80 rotate-90" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
