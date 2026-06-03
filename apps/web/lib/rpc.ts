import type { AppType } from "@repo/worker";
import { hc } from "hono/client";

// Browser: use env var for worker URL; Server: use API_URL env var.
const baseUrl =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? window.location.origin)
    : (process.env.API_URL ?? "");

export const client = hc<AppType>(baseUrl);
