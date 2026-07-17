import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
} | null;

// Past tense for successful mutations, infinitive for "Failed to ___" error
// phrasing. GET only ever appears in the log when it errors (see `record`
// below), so it has no past-tense form worth writing.
const ACTION_VERBS: Record<string, { past: string; infinitive: string }> = {
  POST: { past: "Created", infinitive: "create" },
  PUT: { past: "Updated", infinitive: "update" },
  PATCH: { past: "Updated", infinitive: "update" },
  DELETE: { past: "Deleted", infinitive: "delete" },
  GET: { past: "Viewed", infinitive: "access" },
};

// Nicer labels for the first path segment after /api/.
const RESOURCE_LABELS: Record<string, string> = {
  products: "product",
  product: "product",
  categories: "category",
  reviews: "review",
  orders: "order",
  checkout: "checkout",
  collection: "collection",
  testimonials: "testimonial",
  wishlist: "wishlist",
  cart: "cart",
  steadfast: "courier booking",
  settings: "settings",
  blog: "blog post",
  pos: "POS sale",
  reports: "report",
  expenses: "expense",
  roles: "role",
  users: "user",
  auth: "account",
};

function describe(method: string, path: string, isError: boolean): string {
  const segments = path.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const resource = segments[0] ?? "";
  const label = RESOURCE_LABELS[resource] ?? resource.replace(/-/g, " ");
  const verbs = ACTION_VERBS[method] ?? { past: method, infinitive: method.toLowerCase() };
  // Sub-actions read better with the tail included: "Updated order status".
  const tail = segments
    .slice(1)
    .filter((s) => !/^[a-z0-9]{20,}$/i.test(s)) // drop opaque ids
    .join(" ")
    .replace(/-/g, " ");
  const target = [label, tail].filter(Boolean).join(" ");
  return isError ? `Failed to ${verbs.infinitive} ${target}`.trim() : `${verbs.past} ${target}`.trim();
}

// POST endpoints that are semantically reads (bulk lookups, status polls) —
// they fire automatically when pages load and would flood the log.
const EXCLUDED_PATHS = [/^\/api\/steadfast\/track-batch$/, /^\/api\/activity/];

function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

async function record(c: Context, user: SessionUser, status: number) {
  if (!user) return;
  const isDashboardUser =
    user.role === "ADMIN" ||
    user.role === "MODERATOR" ||
    (Array.isArray(user.permissions) && user.permissions.length > 0);
  if (!isDashboardUser) return;

  const method = c.req.method.toUpperCase();
  if (method === "HEAD" || method === "OPTIONS") return;

  const path = new URL(c.req.url).pathname;
  if (EXCLUDED_PATHS.some((p) => p.test(path))) return;

  const isError = status >= 400;
  // Successful reads are noise (every page load fires several); only log
  // GETs when they fail, so permission/auth/server errors still surface.
  if (method === "GET" && !isError) return;

  try {
    await db.insert(activityLogs).values({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: describe(method, path, isError),
      method,
      path,
      status,
      ip: clientIp(c.req.raw.headers),
    });
  } catch (error) {
    // Auditing must never break the actual request.
    console.error("Failed to write activity log:", error);
  }
}

// Global middleware: records every mutating API request made by a dashboard
// user (anyone with an admin/moderator role or custom role permissions), plus
// any request — including reads — that errors, so failed and crashed actions
// show up in the log alongside successful ones. Storefront customers and
// anonymous requests are never logged.
export const logActivity = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (error) {
    const user = c.get("user" as never) as SessionUser;
    const status = error instanceof HTTPException ? error.status : 500;
    await record(c, user, status);
    throw error; // preserve normal error handling/response for the client
  }

  const user = c.get("user" as never) as SessionUser;
  await record(c, user, c.res.status);
});
