"use client";

import { Button } from "@/components/ui/button";
import { useWishlistToggle } from "@/lib/helpers";
import { Product } from "@/lib/types";
import { Heart, ShoppingBag, Phone, MessageCircle, ShoppingCart, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/hooks/use-language";
import { useCartStore } from "@/features/cart/state/use-cart-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePixelTracking } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/traffic-tracker";

interface ProductPickerProps {
  product: Product;
}

function ProductPicker({ product }: ProductPickerProps) {
  const { t } = useLanguage();
  const isColorAvailable = (product.colors?.length ?? 0) > 0;
  const isSizeAvailable = (product.sizes?.length ?? 0) > 0;
  const isInStock = product.stock > 0;

  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const { track } = usePixelTracking();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product.defaultVariantName || "");
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"cart" | "buy" | null>(null);
  
  const hasVariants = isColorAvailable || isSizeAvailable;
  
  const [highlightVariant, setHighlightVariant] = useState(false);
  const { isInWishlist, isAdding, isRemoving, handleWishlistToggle } =
    useWishlistToggle({ productId: product.id });

  const currentVariant = product.colors?.find(c => c.name === selectedColor);
  const displayPrice = currentVariant && (currentVariant.price !== null && currentVariant.price !== undefined)
    ? currentVariant.price
    : product.price;

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
      if (!selectedColor && isColorAvailable) {
        setHighlightVariant(true);
        setTimeout(() => setHighlightVariant(false), 2000);
      }
      toast.error("Please select options before adding to cart");
      return;
    }

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

  const handleBuyNow = () => {
    if (
      (!selectedSize && isSizeAvailable) ||
      (!selectedColor && isColorAvailable)
    ) {
      if (!selectedColor && isColorAvailable) {
        setHighlightVariant(true);
        setTimeout(() => setHighlightVariant(false), 2000);
      }
      toast.error("Please select options before proceeding to checkout");
      return;
    }

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
    });

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

    router.push("/checkout");
  };

  return (
    <>
      {/* Dialog for Variants */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("selectOption")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {isSizeAvailable && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Size</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
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

            {isColorAvailable && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Variant</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors?.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedColor === color.name
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {color.name} ({formatAmount(color.price || product.price)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full mt-4">
            {dialogAction === "cart" && (
              <Button
                className="flex-1 h-12 rounded-xl text-sm font-semibold tracking-wide border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
                onClick={() => {
                  if ((isSizeAvailable && !selectedSize) || (isColorAvailable && !selectedColor)) {
                    toast.error("Please select options before adding to cart");
                    return;
                  }
                  handleAddToCart();
                  setIsDialogOpen(false);
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" fill="currentColor" />
                {t("addToCart")}
              </Button>
            )}
            {dialogAction === "buy" && (
              <Button
                className="animate-cta-wiggle flex-1 h-12 rounded-xl text-sm font-semibold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                onClick={() => {
                  if ((isSizeAvailable && !selectedSize) || (isColorAvailable && !selectedColor)) {
                    toast.error("Please select options before proceeding to checkout");
                    return;
                  }
                  handleBuyNow();
                  setIsDialogOpen(false);
                }}
              >
                <Zap className="h-4 w-4 mr-2" fill="currentColor" />
                {t("buyNow")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 lg:gap-4 mb-4 lg:mb-8">
        {/* Top Row: Quantity & Wishlist */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-border/50 shadow-sm rounded-full px-1.5 h-12 lg:h-14 w-32 lg:w-36 shrink-0">
            <button
              className="h-9 w-9 lg:h-11 lg:w-11 flex items-center justify-center rounded-full text-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground transition-all disabled:opacity-50 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="w-8 text-center font-bold text-[15px] text-foreground">{quantity}</span>
            <button
              className="h-9 w-9 lg:h-11 lg:w-11 flex items-center justify-center rounded-full text-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground transition-all disabled:opacity-50 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center leading-tight">
            <span className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Price</span>
            <div className="flex items-baseline gap-2">
              {product.discount > 0 && (
                <span className="text-sm line-through text-muted-foreground font-medium">
                  {formatAmount((displayPrice / (1 - product.discount / 100)) * quantity)}
                </span>
              )}
              <span className="font-bold text-lg lg:text-xl text-foreground">
                {formatAmount(displayPrice * quantity)}
              </span>
            </div>
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
            className="h-12 lg:h-14 rounded-full text-sm lg:text-base font-semibold tracking-wide border-2 border-foreground bg-white dark:bg-slate-900 text-foreground hover:bg-foreground hover:text-background transition-all"
            disabled={!isInStock}
            onClick={() => {
              if (hasVariants) {
                setDialogAction("cart");
                setIsDialogOpen(true);
              } else {
                handleAddToCart();
              }
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" fill="currentColor" />
            {isInStock ? t("addToCart") : t("outOfStock")}
          </Button>

          <Button
            className="animate-cta-wiggle h-12 lg:h-14 rounded-full text-sm lg:text-base font-semibold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            disabled={!isInStock}
            onClick={() => {
              if (hasVariants) {
                setDialogAction("buy");
                setIsDialogOpen(true);
              } else {
                handleBuyNow();
              }
            }}
          >
            <Zap className="h-4 w-4 mr-2" fill="currentColor" />
            {t("buyNow")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <a 
            href="tel:+8801700000000"
            className="flex items-center justify-center h-12 rounded-full font-medium border border-border bg-background hover:bg-secondary/50 transition-colors text-sm"
          >
            <Phone className="mr-2 h-4 w-4" fill="currentColor" />
            {t("phoneOrder")}
          </a>
          <a 
            href="https://wa.me/8801700000000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center h-12 rounded-full font-medium border border-green-500 bg-white dark:bg-slate-900 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-sm"
          >
            <MessageCircle className="mr-2 h-4 w-4" fill="currentColor" />
            {t("whatsappOrder")}
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
          <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0 pr-4">
            {product.images && product.images[0] && (
              <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-secondary/20 border border-border/50 shadow-sm">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground font-medium">{formatAmount(displayPrice)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:w-40 h-12 rounded-full font-semibold border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
              disabled={!isInStock}
              onClick={() => {
                if (hasVariants) {
                  setDialogAction("cart");
                  setIsDialogOpen(true);
                } else {
                  handleAddToCart();
                }
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" fill="currentColor" />
              {isInStock ? t("addToCart") : t("outOfStock")}
            </Button>

            <Button
              className="animate-cta-wiggle flex-1 sm:w-40 h-12 rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              disabled={!isInStock}
              onClick={() => {
                if (hasVariants) {
                  setDialogAction("buy");
                  setIsDialogOpen(true);
                } else {
                  handleBuyNow();
                }
              }}
            >
              <Zap className="h-4 w-4 mr-2" fill="currentColor" />
              {t("buyNow")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductPicker;
