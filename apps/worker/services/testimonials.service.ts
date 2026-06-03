import db from "@repo/database";

export async function getTestimonials() {
  const testimonials = await db.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  return { success: true, testimonials };
}
