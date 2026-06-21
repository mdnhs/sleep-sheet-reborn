"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    image: "/hero-slider-1.png",
    title: "টক, ঝাল, মিষ্টি",
    subtitle: "স্বাদের পরিপূর্ণতায়",
    heading: "প্রিমিয়াম আচার কম্বো",
    link: "/products?category=Pickles",
  },
  {
    id: 2,
    image: "/hero-banner-1.png",
    title: "সবসময় সব আয়োজনে",
    subtitle: "খাঁটি স্বাদের নিশ্চয়তা",
    heading: "পরিবারের সাথে",
    link: "/products?category=Pickles",
  },
  {
    id: 3,
    image: "/hero-banner-2.png",
    title: "স্বাদে ভরা ঘ্রাণে কড়া",
    subtitle: "খাঁটি সরিষার তেল",
    heading: "ঝাঁঝে অনন্য",
    link: "/products?category=Oil",
  },
];

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="w-full bg-background py-6">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[460px] xl:h-[520px]">
          {/* Left: Main Slider (Carousel) */}
          <div className="lg:col-span-2 relative w-full h-[320px] sm:h-[400px] lg:h-full rounded-[1.5rem] overflow-hidden shadow-sm group">
            {/* Slides */}
            {SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.heading}
                  fill
                  priority={index === 0}
                  className="object-cover"
                />
                {/* Overlay Text */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25 flex flex-col items-center pt-8 sm:pt-12 text-center px-6 select-none">
                  <span
                    className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#b45309] tracking-wide"
                    style={{ textShadow: "0 2px 4px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.6)" }}
                  >
                    {slide.title}
                  </span>
                  <span
                    className="text-sm sm:text-base md:text-lg font-medium text-amber-950 mt-1 sm:mt-2"
                    style={{ textShadow: "0 1.5px 3px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.5)" }}
                  >
                    {slide.subtitle}
                  </span>
                  <h1
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-[#b45309] mt-1 sm:mt-2"
                    style={{ textShadow: "0 2px 6px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.6)" }}
                  >
                    {slide.heading}
                  </h1>
                  <Link
                    href={slide.link}
                    className="mt-4 sm:mt-6 px-6 py-2 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold rounded-full shadow-md hover:scale-105 transition-all duration-300"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-primary shadow-md hover:scale-105 transition-all duration-200 focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-primary shadow-md hover:scale-105 transition-all duration-200 focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 stroke-[2.5]" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === index ? "w-8 bg-primary" : "w-2.5 bg-white/60 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Stacked Banners */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full w-full">
            {/* Top Right Card */}
            <div className="relative flex-1 h-[180px] lg:h-1/2 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
              <Image
                src="/hero-banner-1.png"
                alt="Pickles set"
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent p-6 flex flex-col justify-between">
                <div className="max-w-[180px]">
                  <p
                    className="text-xs uppercase tracking-wider text-amber-900 font-bold"
                    style={{ textShadow: "0 1px 2px rgba(255, 255, 255, 0.8)" }}
                  >
                    সবসময়
                  </p>
                  <h3
                    className="text-lg sm:text-xl font-extrabold text-[#b45309] leading-tight mt-1"
                    style={{ textShadow: "0 1.5px 3px rgba(255, 255, 255, 0.9)" }}
                  >
                    সব আয়োজনে পরিবারের সাথে
                  </h3>
                </div>
                <Link
                  href="/products?category=Pickles"
                  className="w-fit text-xs font-semibold text-primary hover:underline"
                  style={{ textShadow: "0 1px 2px rgba(255, 255, 255, 0.8)" }}
                >
                  View Details →
                </Link>
              </div>
            </div>

            {/* Bottom Right Card */}
            <div className="relative flex-1 h-[180px] lg:h-1/2 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
              <Image
                src="/hero-banner-2.png"
                alt="Mustard Oil"
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent p-6 flex flex-col justify-between">
                <div className="max-w-[180px]">
                  <p
                    className="text-xs uppercase tracking-wider text-amber-900 font-bold"
                    style={{ textShadow: "0 1px 2px rgba(255, 255, 255, 0.8)" }}
                  >
                    স্বাদে ভরা
                  </p>
                  <h3
                    className="text-lg sm:text-xl font-extrabold text-[#b45309] leading-tight mt-1"
                    style={{ textShadow: "0 1.5px 3px rgba(255, 255, 255, 0.9)" }}
                  >
                    ঝাঁঝে অনন্য খাঁটি তেল
                  </h3>
                </div>
                <Link
                  href="/products?category=Oil"
                  className="w-fit text-xs font-semibold text-primary hover:underline"
                  style={{ textShadow: "0 1px 2px rgba(255, 255, 255, 0.8)" }}
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
