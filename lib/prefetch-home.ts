import { unstable_cache } from "next/cache";
import settingsApp from "@/features/settings/server/route";

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

// Server-side data cache so per-request SSR pages don't hit the database for
// layout settings on every render.
export const getPublicSettings = unstable_cache(
  () => fromRoute<Record<string, string>>(settingsApp, "/"),
  ["prefetch-settings"],
  { revalidate: 300, tags: ["settings"] },
);
