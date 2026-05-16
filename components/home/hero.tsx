import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[88vh] items-stretch">
          {/* Left: Content */}
          <div className="flex flex-col justify-center py-20 lg:py-28 lg:pr-16 space-y-10">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-primary">
                <span className="w-8 h-px bg-primary inline-block" />
                New Collection · 2024
              </span>
              <h1 className="font-heading text-5xl md:text-6xl xl:text-[4.5rem] font-light leading-[1.05] tracking-tight text-foreground">
                Sleep,
                <br />
                <span className="italic">elevated.</span>
              </h1>
              <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
                Premium linen bedding crafted for rest that truly restores.
                Sustainable materials, timeless comfort.
              </p>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <Button
                size="lg"
                nativeButton={false}
                className="rounded-none h-12 px-8 text-sm font-medium tracking-wide"
                render={
                  <Link
                    href="/products?sort=newest"
                    className="flex items-center gap-2"
                  />
                }
              >
                Shop Collection <ArrowRight className="h-4 w-4" />
              </Button>
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Our Story
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-6 border-t border-border">
              {[
                { value: "500+", label: "Products" },
                { value: "10k+", label: "Customers" },
                { value: "4.9★", label: "Rating" },
              ].map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <div className="w-px h-8 bg-border" />}
                  <div>
                    <p className="text-xl font-heading font-light text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right: Full-bleed image */}
          <div className="relative hidden lg:block">
            <Image
              src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200"
              alt="Premium linen bedroom"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-8 left-8 bg-background/95 backdrop-blur-sm px-5 py-4 border border-border max-w-55">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Featured
              </p>
              <p className="text-sm font-medium mt-1 text-foreground leading-tight">
                Signature Linen Collection
              </p>
              <p className="text-xs text-primary font-medium mt-1.5">
                Shop Now →
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
