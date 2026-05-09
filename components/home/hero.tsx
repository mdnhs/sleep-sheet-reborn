import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function Hero() {
  return (
    <section className=" relative overflow-hidden bg-secondary/50 py-24 md:py-32">
      <div className=" container mx-auto px-4">
        <div className=" grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className=" space-y-6">
            <span className=" inline-block text-sm font-medium uppercase px-3 py-1 bg-primary/10 rounded-full">
              New Collection
            </span>
            <h1 className=" text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-primary">
              Elevate Your Everyday with Premium Essentials
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Thoughtfully designed products for a modern lifestyle. Sustainable
              materials, timeless design, exceptional quality.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                nativeButton={false}
                render={
                  <Link
                    href="/products?sort=newest"
                    className="flex items-center"
                  />
                }
              >
                <span>Shop Now</span> <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href="/about" className="flex items-center" />}
              >
                Our Story
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className=" relative rounded-lg object-cover overflow-hidden w-full h-72 md:h-80">
                <Image
                  src="https://images.unsplash.com/photo-1629367494173-c78a56567877?q=80&w=600"
                  alt="Luxury watch"
                  fill
                  objectFit="cover"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className=" relative rounded-lg object-cover w-full h-56 md:h-64 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=3484&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%"
                  alt="watch"
                  fill
                  objectFit="cover"
                />
              </div>
              <div className=" relative rounded-lg object-cover w-full h-40 md:h-48 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1618354691438-25bc04584c23?q=80&w=600"
                  alt="Cotton shirt"
                  fill
                  objectFit="cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
