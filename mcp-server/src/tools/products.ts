import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api } from "../api-client.js";
import { text } from "../util.js";

// Deliberately no create/delete tools here — an agent editing existing
// listings (price, stock, description, featured flag) is a reasonably safe
// operational task; creating or deleting catalog entries has a much bigger
// blast radius (image uploads, variants, cascading deletes of reviews/cart
// items) and stays a dashboard-only action for now.
export function registerProductTools(server: McpServer) {
  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "List products in the storefront catalog. Supports search and category filtering.",
      inputSchema: {
        search: z.string().optional(),
        category: z.string().optional().describe("Category value/slug, comma-separated for multiple"),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ search, category, page, limit }) => {
      const params = new URLSearchParams({ admin: "true" });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (page) params.set("page", String(page));
      if (limit) params.set("limit", String(limit));
      const data = await api.get(`/products?${params.toString()}`);
      return text(data);
    }
  );

  server.registerTool(
    "get_product",
    {
      title: "Get a product",
      description: "Fetch full details for one product by its id.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const data = await api.get(`/products/${encodeURIComponent(id)}`);
      return text(data);
    }
  );

  server.registerTool(
    "update_product_details",
    {
      title: "Update a product",
      description:
        "Update a product's name, description, price, stock, discount, or featured flag. Only the fields you pass are changed — everything else (images, variants, specifications, tags) is left untouched. Use get_product first if you need to see current values.",
      inputSchema: {
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        stock: z.number().int().min(0).optional(),
        discount: z.number().min(0).max(100).optional().describe("Percent off, 0-100"),
        isFeatured: z.boolean().optional(),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.patch(`/product/${id}/details`, body);
      return text(data);
    }
  );
}
