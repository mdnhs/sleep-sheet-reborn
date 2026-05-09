"use client";
import FeaturedProduct from "@/components/home/featured-product";
import { useGetProduct } from "@/features/product/api/use-get-product";
import ProductPicker from "@/features/product/components/product-picker";
import { ProductStatus } from "@/features/product/components/product-status";
import ProductTab from "@/features/product/components/product-tabs";
import ProductTag from "@/features/product/components/product-tags";
import SwitchImage from "@/features/product/components/switch-image";
import { useProductId } from "@/features/product/hooks/use-product-id";
import { RotateCw, Truck } from "lucide-react";
import React from "react";
import { useCurrency } from "@/hooks/use-currency";

function ProductDetailPage() {
  const id = useProductId();
  const { data: product, isLoading } = useGetProduct({ id });
  const { formatAmount } = useCurrency();

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <>
      <div className=" container mx-auto px-4 py-12">
        <div className=" grid grid-cols-1 lg:grid-cols-2 gap-12">
          <SwitchImage product={product} />
          <div>
            <p className=" uppercase text-muted-foreground text-sm mb-2">
              {product.category}
            </p>
            <h1 className=" text-3xl font-bold mb-3">{product.name}</h1>
            {/* <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "text-yellow-400 fill-current"
                        : i < product.rating
                        ? "text-yellow-400 fill-current opacity-50"
                        : "text-gray-300 fill-current"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="ml-2 text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </p>
            </div> */}
            <p className="text-2xl font-bold mb-4">
              {formatAmount(product.price)}
            </p>

            <ProductStatus stock={product.stock} />
            <p className="text-muted-foreground mb-4">{product.description}</p>
            <ProductTag tags={product.tags} />
            <ProductPicker product={product} />
            <div className="space-y-4">
              <div className="flex items-start">
                <Truck className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Free Shipping</h4>
                  <p className="text-sm text-muted-foreground">
                    Free standard shipping on orders over $50. Expedited
                    shipping options available at checkout.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <RotateCw className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Easy Returns</h4>
                  <p className="text-sm text-muted-foreground">
                    Not the right fit? Return within 30 days for a full refund
                    or exchange.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ProductTab product={product} />
      </div>
      <div className="mt-20">
        <FeaturedProduct />
      </div>
    </>
  );
}

export default ProductDetailPage;
