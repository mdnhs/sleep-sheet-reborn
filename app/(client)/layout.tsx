import { getPublicSettings } from "@/lib/prefetch-home";
import { SettingsSeed } from "@/provider/settings-seed";
import ClientLayout from "./client-layout";

// Refresh the baked-in settings for static storefront pages every 5 minutes.
// The homepage's own revalidate = 60 still wins for that route.
export const revalidate = 300;

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
