"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useWebsiteSettings } from "@/hooks/use-website-settings";

function HeroSkeleton() {
  return (
    <section className="w-full bg-background py-4 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[320px] xl:h-[400px]">
          {/* Left: Main Slider Skeleton */}
          <div className="lg:col-span-2 relative w-full h-55 sm:h-100 lg:h-full rounded-2xl overflow-hidden bg-muted animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-muted-foreground/10 to-muted-foreground/5" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
              <div className="h-3 w-24 bg-muted-foreground/20 rounded-full" />
              <div className="h-10 w-64 bg-muted-foreground/20 rounded-lg" />
              <div className="h-10 w-48 bg-muted-foreground/20 rounded-lg" />
              <div className="h-12 w-40 bg-muted-foreground/20 rounded-full mt-4" />
            </div>
            {/* Navigation arrows placeholder */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-muted-foreground/10 hidden sm:block" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-muted-foreground/10 hidden sm:block" />
            {/* Indicators placeholder */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="h-1.5 w-8 bg-muted-foreground/20 rounded-full" />
              <div className="h-1.5 w-1.5 bg-muted-foreground/20 rounded-full" />
              <div className="h-1.5 w-1.5 bg-muted-foreground/20 rounded-full" />
            </div>
          </div>

          {/* Right: Stacked Banners Skeleton */}
          <div className="lg:col-span-1 hidden md:flex flex-col gap-4 h-full w-full">
            <div className="relative flex-1 h-[160px] lg:h-1/2 rounded-2xl overflow-hidden bg-muted animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-muted-foreground/10 to-transparent" />
              <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                <div className="h-2 w-16 bg-muted-foreground/20 rounded-full" />
                <div className="h-6 w-40 bg-muted-foreground/20 rounded" />
                <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
              </div>
            </div>
            <div className="relative flex-1 h-[160px] lg:h-1/2 rounded-2xl overflow-hidden bg-muted animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-muted-foreground/10 to-transparent" />
              <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                <div className="h-2 w-20 bg-muted-foreground/20 rounded-full" />
                <div className="h-6 w-48 bg-muted-foreground/20 rounded" />
                <div className="h-3 w-20 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero() {
  const {
    heroTitle,
    heroSubtitle,
    heroCtaText,
    heroCtaLink,
    heroSlides,
    promoBanners,
    isLoading,
  } = useWebsiteSettings();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (isLoading) {
    return <HeroSkeleton />;
  }

  if (!heroSlides || heroSlides.length === 0) {
    return null;
  }

  if (!promoBanners || promoBanners.length === 0) {
    return null;
  }

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );
  }, [heroSlides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slideData = heroSlides.map((slide, index) => {
    if (index === 0) {
      return {
        ...slide,
        title: heroTitle || slide.title,
        heading: heroSubtitle || slide.heading,
        link: heroCtaLink || slide.link,
      };
    }
    return slide;
  });

  return (
    <section className="w-full bg-background py-4 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[320px] xl:h-[400px]">
          {/* Left: Main Slider (Carousel) */}
          <div className="lg:col-span-2 relative w-full h-55 sm:h-100 lg:h-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
            {/* Slides */}
            {slideData.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.heading}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  quality={90}
                  priority={index < 2}
                  className="object-cover transition-transform duration-[15000ms] ease-linear scale-100 group-hover:scale-110"
                />
              </div>
            ))}

            {/* Premium Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-white hover:text-foreground transition-all duration-300 focus:outline-none hidden sm:flex -translate-x-4 group-hover:translate-x-0 shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2]" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-white hover:text-foreground transition-all duration-300 focus:outline-none hidden sm:flex translate-x-4 group-hover:translate-x-0 shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 stroke-[2]" />
            </button>

            {/* Minimal Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slideData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 transition-all duration-500 rounded-full ${
                    currentSlide === index
                      ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                      : "w-1.5 bg-white/40 hover:bg-white/80 hover:w-3"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Stacked Banners */}
          <div className="lg:col-span-1 hidden md:flex flex-col gap-4 h-full w-full">
            {promoBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.link}
                className="relative flex-1 h-[160px] lg:h-1/2 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 group border border-slate-100 dark:border-slate-800"
              >
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  quality={90}
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/90 font-bold mb-1.5 flex items-center gap-2">
                      <span className="h-px w-4 bg-white/90"></span>
                      {banner.subtitle}
                    </p>
                    <h3 className="text-2xl font-heading font-medium text-white leading-tight mb-2">
                      {banner.title}
                    </h3>
                    <div className="flex items-center text-[11px] uppercase tracking-wider font-bold text-white group-hover:text-primary-foreground transition-colors">
                      {banner.linkText}{" "}
                      <ArrowRight className="h-3 w-3 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
