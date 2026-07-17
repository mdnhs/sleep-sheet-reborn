import { QueryClient } from "@tanstack/react-query";
import { unstable_cache } from "next/cache";
import settingsApp from "@/features/settings/server/route";
import productsApp from "@/features/product/server/route";
import categoriesApp from "@/features/categories/server/route";

// Runs the public Hono GET handlers in-process (no HTTP round trip) and
// seeds a React Query cache with the results under the exact keys the
// client hooks use. The dehydrated cache lets storefront pages render with
// real content in the server HTML instead of skeletons; if any fetch
// fails, prefetchQuery stores the error and the client simply falls back
// to fetching as before.
async function fromRoute<T>(app: { request: (path: string) => Response | Promise<Response> }, path: string): Promise<T> {
  const res = await app.request(path);
  if (!res.ok) throw new Error(`Prefetch ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// Server-side data cache so per-request SSR pages (product detail, auth,
// etc.) don't hit the database for layout data on every render.
export const getPublicSettings = unstable_cache(
  () => fromRoute<Record<string, string>>(settingsApp, "/"),
  ["prefetch-settings"],
  { revalidate: 300, tags: ["settings"] },
);

const getNewestProducts = unstable_cache(
  () => fromRoute(productsApp, "/?sort=newest"),
  ["prefetch-products-newest"],
  { revalidate: 60, tags: ["products"] },
);

const getCategoryShowcase = unstable_cache(
  () => fromRoute(categoriesApp, "/category"),
  ["prefetch-category-showcase"],
  { revalidate: 300, tags: ["categories"] },
);

const getCategories = unstable_cache(
  () => fromRoute(categoriesApp, "/"),
  ["prefetch-categories"],
  { revalidate: 300, tags: ["categories"] },
);

// Homepage-level: the product/category sections below the hero.
export async function prefetchHomeData(): Promise<QueryClient> {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      // Must match useGetProducts({ sort: "newest" }) in FeaturedProduct.
      queryKey: ["products", { sort: "newest" }],
      queryFn: getNewestProducts,
    }),
    queryClient.prefetchQuery({
      // Must match useGetCategory() in Categories.
      queryKey: ["category"],
      queryFn: getCategoryShowcase,
    }),
    queryClient.prefetchQuery({
      // Must match useGetCategories() in SubcategoryProducts.
      queryKey: ["categories"],
      queryFn: getCategories,
    }),
  ]);

  return queryClient;
}
