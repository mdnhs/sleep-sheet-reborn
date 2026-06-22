"use client";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface SwitchImageProps {
  product: Product;
}

function SwitchImage({ product }: SwitchImageProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
  };
  return (
    <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] bg-secondary/20 overflow-hidden shadow-sm h-[280px] sm:h-[400px] lg:h-[550px]">
      <Image
        src={product.images[selectedImage]}
        alt="Product Image"
        fill
        priority={true}
        className="object-cover transition-transform duration-700"
      />
      
      {/* Thumbnails Overlay */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 sm:gap-3 px-4 z-10">
        {product.images.slice(0, 3).map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative aspect-[4/5] w-16 sm:w-24 md:w-28 rounded-lg sm:rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
              selectedImage === index 
                ? "ring-2 ring-white scale-100 opacity-100" 
                : "opacity-80 hover:opacity-100 hover:scale-[1.02] border-2 border-transparent"
            }`}
          >
            <Image
              src={image}
              fill
              alt={`${product.name} view ${index + 1}`}
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default SwitchImage;
