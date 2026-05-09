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
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg bg-secondary aspect-square">
        <Image
          src={product.images[selectedImage]}
          alt="Product Image"
          width={500}
          height={500}
          priority={true}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={prevImage}
            className="rounded-full opacity-80 hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={nextImage}
            className="rounded-full opacity-80 hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {product.images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`aspect-square rounded-md overflow-hidden border-2 ${
              selectedImage === index ? "border-primary" : "border-transparent"
            }`}
          >
            <Image
              src={image}
              width={100}
              height={100}
              alt={`${product.name} view ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default SwitchImage;
