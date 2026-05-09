import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";


export const useGetTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const response = await client.api.testimonials.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch testimonials");
      }

      return response.json();
    },
  });
};
