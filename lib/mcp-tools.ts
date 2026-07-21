import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface McpToolContext {
  /** This deployment's own origin, e.g. https://yourstore.com */
  origin: string;
  /** The same bearer token (API key or OAuth access token) the caller used
   * to reach /api/mcp — forwarded as-is to internal API calls, since
   * session-middleware already accepts both formats. No separate internal
   * credential needed. */
  bearerToken: string;
}

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

/** Same role as mcp-server/src/api-client.ts, adapted for the embedded
 * (Connector) path: it calls this same deployment's own /api routes rather
 * than a separately-configured URL. */
function makeApiClient({ origin, bearerToken }: McpToolContext) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${origin}/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        (data as { error?: string; message?: string })?.error ||
        (data as { error?: string; message?: string })?.message ||
        `Request failed with status ${res.status}`;
      throw new Error(message);
    }
    return data as T;
  }

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  };
}

/**
 * Registers the same tool set as the local mcp-server package (see
 * mcp-server/src/tools/*.ts) but wired to call this deployment's own API
 * in-process rather than a separately-configured URL — used by the remote
 * /api/mcp Connector endpoint. Keep the two in sync if you add a tool to one.
 */
export function registerMcpTools(server: McpServer, ctx: McpToolContext) {
  const api = makeApiClient(ctx);

  // --- Blog ---
  server.registerTool(
    "list_blog_posts",
    {
      title: "List blog posts",
      description: "List blog posts on the store, newest first. Optionally filter by search text.",
      inputSchema: { search: z.string().optional(), page: z.number().int().min(1).optional() },
    },
    async ({ search, page }) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (page) params.set("page", String(page));
      return text(await api.get(`/blog?${params.toString()}`));
    }
  );

  server.registerTool(
    "get_blog_post",
    {
      title: "Get a blog post",
      description: "Fetch one blog post by its slug (or id).",
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => text(await api.get(`/blog/${encodeURIComponent(slug)}`))
  );

  server.registerTool(
    "create_blog_post",
    {
      title: "Create a blog post",
      description:
        "Create a new blog post. `slug` must be unique and URL-safe (lowercase, hyphens). Set isPublished:true to publish immediately, or false to save as a draft.",
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().min(1),
        summary: z.string().optional(),
        content: z.string().min(1),
        coverImage: z.string().url().optional(),
        isPublished: z.boolean().default(false),
      },
    },
    async (input) => text(await api.post("/blog", input))
  );

  server.registerTool(
    "update_blog_post",
    {
      title: "Update a blog post",
      description:
        "Replace an existing blog post's content by id. All fields are required (mirrors the site's edit form) — use get_blog_post first if you only want to change one field.",
      inputSchema: {
        id: z.string(),
        title: z.string().min(1),
        slug: z.string().min(1),
        summary: z.string().optional(),
        content: z.string().min(1),
        coverImage: z.string().url().optional(),
        isPublished: z.boolean(),
      },
    },
    async ({ id, ...body }) => text(await api.put(`/blog/${id}`, body))
  );

  server.registerTool(
    "set_blog_post_published",
    {
      title: "Publish or unpublish a blog post",
      description: "Toggle a blog post's published status without touching its content.",
      inputSchema: { id: z.string(), isPublished: z.boolean() },
    },
    async ({ id, isPublished }) => text(await api.patch(`/blog/${id}/publish`, { isPublished }))
  );

  // --- Products (no create/delete — see mcp-server/src/tools/products.ts for why) ---
  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "List products in the storefront catalog. Supports search and category filtering.",
      inputSchema: {
        search: z.string().optional(),
        category: z.string().optional(),
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
      return text(await api.get(`/products?${params.toString()}`));
    }
  );

  server.registerTool(
    "get_product",
    {
      title: "Get a product",
      description: "Fetch full details for one product by its id.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => text(await api.get(`/products/${encodeURIComponent(id)}`))
  );

  server.registerTool(
    "update_product_details",
    {
      title: "Update a product",
      description:
        "Update a product's name, description, price, stock, discount, or featured flag. Only the fields you pass are changed — images, variants, specifications, and tags are left untouched.",
      inputSchema: {
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        stock: z.number().int().min(0).optional(),
        discount: z.number().min(0).max(100).optional(),
        isFeatured: z.boolean().optional(),
      },
    },
    async ({ id, ...body }) => text(await api.patch(`/product/${id}/details`, body))
  );

  // --- Orders (no refund/delete — see mcp-server/src/tools/orders.ts for why) ---
  server.registerTool(
    "list_orders",
    {
      title: "List orders",
      description: "List orders, newest first. Optionally search by order number or customer, or filter by date range.",
      inputSchema: { search: z.string().optional(), from: z.string().optional(), to: z.string().optional() },
    },
    async ({ search, from, to }) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return text(await api.get(`/orders?${params.toString()}`));
    }
  );

  server.registerTool(
    "get_order",
    {
      title: "Get an order",
      description: "Fetch full details for one order by its id, including items, customer, and payment info.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => text(await api.get(`/orders/${encodeURIComponent(id)}`))
  );

  server.registerTool(
    "update_order_status",
    {
      title: "Update an order's status",
      description: "Change an order's fulfilment and/or payment status. Writes a timeline entry automatically.",
      inputSchema: {
        id: z.string(),
        status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
      },
    },
    async ({ id, ...body }) => text(await api.patch(`/orders/${id}`, body))
  );

  server.registerTool(
    "cancel_order",
    {
      title: "Cancel an order",
      description: "Cancel an order. By default restocks the ordered items — pass restock:false to skip that.",
      inputSchema: { id: z.string(), reason: z.string().max(500).optional(), restock: z.boolean().default(true) },
    },
    async ({ id, ...body }) => text(await api.post(`/orders/${id}/cancel`, body))
  );
}
