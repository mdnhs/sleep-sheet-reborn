import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { isServiceError } from "@/lib/service-error";
import { placeOrder, listShippingMethods } from "./checkout.service";

const app = new Hono()

  .post("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const { shippingInfo, paymentInfo, guestItems } = await c.req.json();

    try {
      const result = await placeOrder({ user, shippingInfo, paymentInfo, guestItems });
      return c.json(result);
    } catch (error) {
      if (isServiceError(error)) return c.json({ message: error.message }, error.status);
      console.error("Error placing order:", error);
      return c.json({ message: "Error placing order" }, 500);
    }
  })

  .get("/shipping-methods", async (c) => {
    try {
      return c.json(await listShippingMethods());
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      return c.json({ error: "Failed to fetch shipping methods" }, 500);
    }
  });

export default app;
