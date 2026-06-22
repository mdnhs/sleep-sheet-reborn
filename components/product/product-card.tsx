"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Heart, Star, ChevronUp, ShoppingCart, X, Minus, Plus, Tag, ArrowUpCircle } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useAppDispatch } from "@/store/hooks";
import { addToCart } from "@/features/cart/state/cart-slice";
import { toast } from "sonner";
import { Product } from "@/lib/types";
import { useWishlistToggle } from "@/lib/helpers";

interface ProductCardProps {
  product: Product & {
    discountTag?: string;
  };
  priority?: boolean;
}

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const { handleWishlistToggle, isAdding, isRemoving, isInWishlist } =
    useWishlistToggle({
      productId: product.id,
    });
  const { formatAmount } = useCurrency();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [quantity, setQuantity] = useState(1);

  const hasColors = product.colors && product.colors.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasVariants = hasColors || hasSizes;

  const dispatchAddToCart = () => {
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
          price: product.price,
          image: product.images?.[0] ?? "",
          description: product.description || "",
        },
      })
    );
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      dispatchAddToCart();
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
    toast.success("Added to cart successfully");
    setIsDrawerOpen(false);
    router.push("/checkout");
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If it has variants and not fully selected or drawer closed, open drawer
    if (hasVariants && (!isDrawerOpen || (hasSizes && !selectedSize) || (hasColors && !selectedColor))) {
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
    <div className="group relative w-full h-full flex flex-col rounded-3xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      
      {/* Product Image */}
      <Link href={`/products/${product.id}`} className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-[#f4f4f5] mb-4 shrink-0 z-0" onClick={(e) => {
        if (isDrawerOpen) e.preventDefault();
      }}>
        <Image
          src={product.images?.[0] || "/placeholder.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          className={`w-full h-full object-cover transition-all duration-700 ${isDrawerOpen ? 'blur-md scale-110 opacity-40' : 'group-hover:scale-105'}`}
        />
        
        {/* Top actions: Discount tag */}
        <div className="absolute top-3 left-3 flex justify-between items-start z-10 w-[calc(100%-24px)]">
          {product.discountTag ? (
            <div className="bg-[#1a1a1a] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="h-3 w-3 text-orange-400" /> {product.discountTag}
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
            className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white hover:scale-110 transition-all duration-300 active:scale-95"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 transition-colors ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-slate-600 hover:text-red-500'}`} />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col px-1 flex-1 relative z-10 bg-white">
        
        {/* Title */}
        <Link href={`/products/${product.id}`} className="flex-1" onClick={(e) => { if (isDrawerOpen) e.preventDefault(); }}>
          <h3 className="font-medium text-[15px] text-slate-800 leading-snug line-clamp-2 mb-3">
            {product.name}
          </h3>
        </Link>
        
        {/* Price and Rating Row */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <p className="font-bold text-[20px] text-slate-800">
              {formatAmount(product.price)}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[14px] text-slate-600 font-medium">
              {product.rating || "4.4"}
            </span>
            <div className="bg-[#f59e0b] p-1 rounded-md">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
            </div>
          </div>
        </div>

        {/* Quantity & Cart Row */}
        <div className="flex items-center gap-3 mb-4">
          {/* Quantity Selector */}
          <div className="flex-1 flex items-center justify-between bg-[#f4f4f5] rounded-xl px-2 h-12" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <button onClick={(e) => updateQuantity(e, -1)} className="p-2 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50" disabled={quantity <= 1}>
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-base font-bold text-slate-800">{quantity}</span>
            <button onClick={(e) => updateQuantity(e, 1)} className="p-2 text-slate-500 hover:text-slate-800 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Add to Cart Button */}
          <button 
            onClick={handleQuickAdd}
            className="shrink-0 w-12 h-12 bg-[#2d2d2d] hover:bg-[#1a1a1a] rounded-xl flex items-center justify-center text-white transition-colors active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Slide-up Drawer Overlay */}
      <div 
        className={`absolute left-0 right-0 bottom-[60px] bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.15)] p-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-30 flex flex-col gap-3 border-t border-slate-100 ${
          isDrawerOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-sm text-slate-800">Select Options</span>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDrawerOpen(false); }}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-col gap-4 max-h-[180px] overflow-y-auto pr-1">
          {hasSizes && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Size</span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(size); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      selectedSize === size 
                        ? 'border-primary bg-primary text-white shadow-sm' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
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
              <span className="text-xs font-semibold text-slate-500 uppercase">Color</span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(color); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      selectedColor === color 
                        ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="relative z-40 px-1 shrink-0 bg-white">
        {isDrawerOpen ? (
          <div className="flex gap-2 w-full">
            <button
              onClick={handleAddToCartVariant}
              className="flex-1 flex items-center justify-center gap-2 bg-[#f8f9fa] hover:bg-slate-200 text-slate-800 border border-slate-200 py-3.5 px-3 rounded-[14px] font-bold text-sm transition-all active:scale-[0.98]"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </button>
            <button
              onClick={handleBuyNowVariant}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white py-3.5 px-3 rounded-[14px] font-bold text-sm transition-all shadow-md active:scale-[0.98]"
            >
              Buy Now
            </button>
          </div>
        ) : (
          <button
            onClick={handleActionClick}
            className="w-full flex items-center justify-between bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white py-3.5 px-5 rounded-[14px] font-medium text-[14px] transition-all active:scale-[0.98]"
          >
            <span>{hasVariants ? "Select Option" : "Buy Now"}</span>
            {hasVariants ? (
              <ChevronUp className="h-5 w-5 opacity-80" />
            ) : (
              <ArrowUpCircle className="h-5 w-5 opacity-80 rotate-90" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
