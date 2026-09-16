import { unstable_cache } from "next/cache";
import settingsApp from "@/features/settings/server/route";
import type { ProductSummary } from "@/lib/types";
import type { BlogPost } from "@/app/(client)/blog/blog-client";
import type { Testimonial } from "@/features/testimonials/api/use-get-testimonials";
import type { PublicCategory } from "@/features/categories/api/use-get-category";

// Runs the public settings Hono GET handler in-process (no HTTP round trip)
// so the (client) layout can seed the ["settings"] React Query cache before
// render. That lets the hero — the homepage's LCP element — appear in the
// server HTML with real content instead of a skeleton, without shipping the
// heavier product/category lists (those fetch client-side, off the critical
// path, to keep hydration/Total Blocking Time down).
async function fromRoute<T>(
  app: { request: (path: string) => Response | Promise<Response> },
  path: string,
): Promise<T> {
  const res = await app.request(path);
  if (!res.ok) throw new Error(`Prefetch ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

import categoriesApp from "@/features/categories/server/route";
import productsApp from "@/features/product/server/route";

// Server-side data cache so per-request SSR pages don't hit the database for
// layout settings on every render.
// The revalidate windows below are deliberately long. Each one is a timer that
// wakes the database when it expires, and with steady crawler traffic a short
// window means the compute never gets to suspend. Everything tagged here is
// also invalidated on write (revalidateTag in the settings route and in
// invalidateFeed), so edits still appear immediately — the timer is only the
// fallback for changes that bypass those paths.
//
// Blog and testimonials used to be the exception here, kept at 30 minutes
// because nothing invalidated them on write. Their write routes call
// invalidateBlog()/invalidateTestimonials() now (lib/content-cache.ts), so
// they sit with everything else.
export const getPublicSettings = unstable_cache(
  () => fromRoute<Record<string, string>>(settingsApp, "/"),
  ["prefetch-settings"],
  { revalidate: 86400, tags: ["settings"] },
);

export const getPublicCategories = unstable_cache(
  () => fromRoute<{ success: boolean; categories: PublicCategory[] }>(categoriesApp, "/category"),
  ["prefetch-categories"],
  { revalidate: 86400, tags: ["categories"] }
);

import blogApp from "@/features/blog/server/route";
import testimonialsApp from "@/features/testimonials/server/route";

export const getPublicProducts = unstable_cache(
  () => fromRoute<{ data: ProductSummary[] }>(productsApp, "/?sort=newest&limit=8"),
  ["prefetch-products"],
  { revalidate: 86400, tags: ["products"] }
);

export const getPublicBlogPosts = unstable_cache(
  () => fromRoute<{ data: BlogPost[] }>(blogApp, "/"),
  ["prefetch-blog"],
  { revalidate: 86400, tags: ["blog"] }
);

export const getPublicTestimonials = unstable_cache(
  () => fromRoute<{ data: Testimonial[]; total: number; hasNextPage: boolean; totalPages: number }>(
    testimonialsApp,
    "/?page=1&limit=12",
  ),
  ["prefetch-testimonials"],
  { revalidate: 86400, tags: ["testimonials"] }
);
