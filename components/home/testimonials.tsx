"use client";

import { useGetTestimonials } from "@/features/testimonials/api/use-get-testimonials";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Testimonials = () => {
  const { data } = useGetTestimonials();
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-lg mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-muted-foreground">
            Don&apos;t just take our word for it. See what our customers have
            experienced.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data?.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background p-6 rounded-lg border border-border flex flex-col"
            >
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-12 w-12">
                  {testimonial.image && (
                    <AvatarImage
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback>
                    {testimonial.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-muted-foreground italic flex-grow">
                &quot;{testimonial.message}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
