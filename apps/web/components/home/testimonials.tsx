"use client";

import { useGetTestimonials } from "@/features/(storefront)/testimonials/api/use-get-testimonials";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Testimonials = () => {
  const { data } = useGetTestimonials();

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-end gap-8 mb-14">
          <div className="shrink-0">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Reviews
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground mt-2">
              What Our Customers Say
            </h2>
          </div>
          <div className="flex-1 h-px bg-border mb-2 hidden md:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-secondary/30 p-8 flex flex-col gap-5 border-l-2 border-primary/30 hover:border-primary transition-colors duration-300"
            >
              {/* Large decorative quote */}
              <span className="font-heading text-6xl leading-none text-primary/20 select-none -mb-2">
                &ldquo;
              </span>

              <p className="text-sm text-muted-foreground leading-relaxed grow">
                {testimonial.message}
              </p>

              <div className="pt-4 border-t border-border flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  {testimonial.image && (
                    <AvatarImage
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-xs">
                    {testimonial.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {testimonial.role}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-primary text-primary"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
