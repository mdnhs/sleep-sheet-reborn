"use client";
import { Product } from "@/lib/types";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import Image from "next/image";
import React, { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface SwitchImageProps {
  product: Product;
}

function SwitchImage({ product }: SwitchImageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  // -1 = closed. Opens at the currently selected image.
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  return (
    <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] bg-secondary/20 overflow-hidden shadow-sm h-50 sm:h-100 lg:h-137.5">
      <button
        type="button"
        onClick={() => setLightboxIndex(selectedImage)}
        className="absolute inset-0 cursor-zoom-in"
        aria-label="Open image gallery"
      >
        <Image
          src={product.images[selectedImage]}
          alt={product.name}
          fill
          priority={true}
          className="object-cover transition-transform duration-700"
        />
      </button>

      {/* Thumbnails Overlay */}
      <div className="absolute top-0 bottom-0 left-4 sm:left-6 flex flex-col justify-center gap-2 sm:gap-3 py-4 z-10">
        {product.images.slice(0, 3).map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative aspect-[4/5] w-14 sm:w-20 md:w-24 rounded-lg sm:rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
              selectedImage === index
                ? "ring-2 ring-white scale-100 opacity-100 shadow-md"
                : "opacity-70 hover:opacity-100 hover:scale-[1.02] border-2 border-transparent"
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

      {/* Fullscreen Lightbox Gallery */}
      <Lightbox
        index={lightboxIndex}
        slides={product.images.map((src, idx) => ({
          src,
          title: product.name,
          description: `Photo ${idx + 1} of ${product.images.length}`,
        }))}
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        plugins={[Captions, Counter, Fullscreen, Slideshow, Thumbnails, Zoom]}
        animation={{ zoom: 600 }}
        zoom={{
          maxZoomPixelRatio: 5,
          zoomInMultiplier: 2,
          scrollToZoom: true,
        }}
        render={{
          iconPrev: () => <IconChevronLeft className="size-6 text-white" />,
          iconNext: () => <IconChevronRight className="size-6 text-white" />,
          iconClose: () => <IconX className="size-6 text-white" />,
        }}
      />
    </div>
  );
}

export default SwitchImage;
