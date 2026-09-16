import { getPublicSettings } from "@/lib/prefetch-home";
import { SettingsSeed } from "@/provider/settings-seed";
import ClientLayout from "./client-layout";

// Storefront pages regenerate hourly. A shorter window here is the single
// biggest reason the database never suspends: every expiry turns the next
// visitor (or crawler) into a fresh set of queries. Content edits do not wait
// for it — they invalidate by tag, see lib/prefetch-home.ts.
export const revalidate = 3600;

// Server layout: fetches the public site settings once (cached server-side)
// and seeds the ["settings"] React Query cache BEFORE the client layout
// renders, so Navbar/Footer/Hero render real content in the server HTML.
export default async function ClientGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings().catch(() => null);

  if (!settings) {
    // Settings unavailable (e.g. DB hiccup): fall back to client-side fetching.
    return <ClientLayout>{children}</ClientLayout>;
  }

  return (
    <SettingsSeed settings={settings}>
      <ClientLayout>{children}</ClientLayout>
    </SettingsSeed>
  );
}
