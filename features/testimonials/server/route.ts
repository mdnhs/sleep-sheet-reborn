import { Hono } from "hono";
import { getTestimonials } from "./testimonials.service";

const app = new Hono()

  .get("/", async (c) => {
    try {
      return c.json(await getTestimonials());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return c.json({ success: false, message: "Failed to fetch testimonials", error: errorMessage }, 500);
    }
  });

export default app;
