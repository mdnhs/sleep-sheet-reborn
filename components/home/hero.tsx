"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1600&auto=format&fit=crop",
    title: "Premium Comfort",
    heading: "Luxury Comforters",
    link: "/products?category=Comforters",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1600&auto=format&fit=crop",
    title: "Soft & Breathable",
    heading: "Bedsheet Collection",
    link: "/products?category=Bedsheets",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1600&auto=format&fit=crop",
    title: "Cozy Nights",
    heading: "Winter Blankets",
    link: "/products?category=Blankets",
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
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="w-full bg-background py-4 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[320px] xl:h-[400px]">
          {/* Left: Main Slider (Carousel) */}
          <div className="lg:col-span-2 relative w-full h-[320px] sm:h-[400px] lg:h-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
            {/* Slides */}
            {SLIDES.map((slide, index) => (
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
                  priority={index === 0}
                  className="object-cover transition-transform duration-[15000ms] ease-linear scale-100 group-hover:scale-110"
                />
                {/* Premium Overlay Text without Blur */}
                <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-center px-6 select-none transition-all duration-700">
                  <div className="flex flex-col items-center transform transition-transform duration-700 hover:scale-[1.02]">
                    <span className="text-xs sm:text-[13px] font-semibold tracking-[0.3em] uppercase text-white/90 mb-3">
                      {slide.title}
                    </span>
                    <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl font-light text-white mb-6">
                      {slide.heading}
                    </h1>
                    <Link
                      href={slide.link}
                      className="group/btn relative overflow-hidden rounded-full bg-white dark:bg-slate-800 px-8 py-3.5 text-foreground dark:text-slate-100 text-xs uppercase tracking-[0.2em] font-bold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center gap-2"
                    >
                      <span className="relative z-10">Shop Now</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1 relative z-10" />
                    </Link>
                  </div>
                </div>
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
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 transition-all duration-500 rounded-full ${
                    currentSlide === index ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-1.5 bg-white/40 hover:bg-white/80 hover:w-3"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Stacked Banners */}
          <div className="lg:col-span-1 flex flex-col gap-4 h-full w-full">
            {/* Top Right Card */}
            <Link href="/products?category=Comforters" className="relative flex-1 h-[160px] lg:h-1/2 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 group border border-slate-100 dark:border-slate-800">
              <Image
                src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop"
                alt="Comforters"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/90 font-bold mb-1.5 flex items-center gap-2">
                    <span className="h-px w-4 bg-white/90"></span>
                    Best Seller
                  </p>
                  <h3 className="text-2xl font-heading font-medium text-white leading-tight mb-2">
                    All-Season Comforters
                  </h3>
                  <div className="flex items-center text-[11px] uppercase tracking-wider font-bold text-white group-hover:text-primary-foreground transition-colors">
                    View Collection <ArrowRight className="h-3 w-3 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Bottom Right Card */}
            <Link href="/products?category=Bedsheets" className="relative flex-1 h-[160px] lg:h-1/2 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 group border border-slate-100 dark:border-slate-800">
              <Image
                src="https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=800&auto=format&fit=crop"
                alt="Bedsheets"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/90 font-bold mb-1.5 flex items-center gap-2">
                    <span className="h-px w-4 bg-white/90"></span>
                    New Arrivals
                  </p>
                  <h3 className="text-2xl font-heading font-medium text-white leading-tight mb-2">
                    Luxury Hotel Bedsheets
                  </h3>
                  <div className="flex items-center text-[11px] uppercase tracking-wider font-bold text-white group-hover:text-primary-foreground transition-colors">
                    Shop Now <ArrowRight className="h-3 w-3 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
