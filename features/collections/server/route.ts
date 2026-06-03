import { Hono } from "hono";
import { isServiceError } from "@/lib/service-error";
import { getCollections } from "./collections.service";

const app = new Hono()

  .get("/", async (c) => {
    try {
      return c.json(await getCollections());
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Collection fetch error:", error);
      return c.json({ error: "Failed to fetch collection" }, 500);
    }
  });

export default app;
