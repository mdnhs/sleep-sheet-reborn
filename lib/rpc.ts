import { AppType } from "@/app/api/[[...route]]/route";
import { hc } from "hono/client";

// In the browser use the current origin (works on any port/domain — dev,
// `pnpm preview`, and the deployed Worker). On the server fall back to the
// configured app URL.
const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "";

export const client = hc<AppType>(baseUrl);
