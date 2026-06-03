import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

type TestimonialsResponse = {
  success: boolean;
  testimonials: Array<{
    id: string;
    name: string;
    message: string;
    rating: number;
    image: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export const useGetTestimonials = () => {
  return useQuery<TestimonialsResponse>({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const response = await client.api.testimonials.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch testimonials");
      }

      return response.json() as Promise<TestimonialsResponse>;
    },
  });
};
