"use client";

import { Product } from "@/lib/types";
import { formatDate, toTitleCase } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

interface ProductReviewsProps {
  product: Product;
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
      : 0;

  const getRatingCount = (stars: number) => {
    return product.reviews.filter((r) => Math.round(r.rating) === stars).length;
  };

  return (
    <div className="w-full mt-20">
      <h2 className="text-2xl font-semibold mb-8 text-foreground tracking-tight">Rating & Reviews</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-24 items-center">
        
        {/* Left Side: Score & Bars */}
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-stretch">
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-1">
              <span className="text-7xl font-bold tracking-tighter text-foreground leading-none">{averageRating.toFixed(1).replace('.', ',')}</span>
              <span className="text-2xl text-muted-foreground font-medium">/ 5</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">({product.reviewCount} New Reviews)</p>
          </div>
          
          <div className="flex-1 w-full max-w-[200px] flex flex-col gap-2 justify-center">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = getRatingCount(star);
              const percentage = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-8">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span className="text-xs font-medium">{star}</span>
                  </div>
                  <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-foreground rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Reviews Carousel */}
        <div className="relative w-full overflow-hidden">
          {product.reviews.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
              {product.reviews.map((review) => (
                <div key={review.id} className="min-w-[300px] max-w-[350px] flex-shrink-0 snap-start border border-border rounded-2xl p-6 bg-background">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{toTitleCase(review.name)}</h4>
                    <span className="text-xs text-muted-foreground">{formatDate(review.date)}</span>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={i < review.rating ? "text-yellow-400" : "text-secondary"}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    "{review.comment}"
                  </p>
                  <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${review.name}`} alt={review.name} className="w-full h-full object-cover" />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded-2xl p-8 text-muted-foreground text-sm">
              No reviews yet. Be the first to review!
            </div>
          )}
          
          <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-background border border-border shadow-sm rounded-full h-8 w-8 flex items-center justify-center hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors z-10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
      </div>
    </div>
  );
}
