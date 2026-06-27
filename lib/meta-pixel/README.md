# Multi Meta Pixel Tracking System

Track events from multiple Facebook Pages/Meta Pixels on a single website with last-click attribution.

## Folder Structure

```
lib/meta-pixel/
  config.ts          -- System config (debug, cookie, defaults)
  pixel-mapping.ts   -- Page → Pixel ID mappings
  storage.ts         -- Cookie + localStorage attribution persistence
  events.ts          -- Event type definitions & payload interfaces
  tracker.ts         -- Core fbq wrapper (init, track, pixel selection)
  utils.ts           -- URL parsing, validation, debug logger
  provider.tsx       -- React context provider
  hooks.ts           -- React hooks (usePixelTracking, useAttribution)
  index.ts           -- Barrel exports
```

## Attribution Flow

1. Visitor lands from an ad/boosted post with URL params
2. `PixelProvider` parses params on mount → determines Pixel ID
3. Attribution is saved to cookie (primary) + localStorage (fallback)
4. **Last-click wins**: each new attribution overwrites the previous
5. Stored attribution includes: Pixel ID, Page Name, Campaign, Timestamp, UTM values

### Supported URL parameters

| Param | Example | Resolves To |
|---|---|---|
| `?pixel=111111111111111` | Direct Pixel ID | That Pixel ID |
| `?page=page_a` | Page name from mapping | `PixelMapping.page_a` → `111111111111111` |
| `?utm_campaign=page_a` | UTM campaign | Same as `?page=` |

## How Pixel Is Selected

```
URL attribution detected? → Yes → Save & use that Pixel
         ↓ No
Stored attribution exists? → Yes → Use stored Pixel
         ↓ No
Default pixel configured? → Yes → Use default Pixel
         ↓ No
Skip tracking
```

## Adding a New Page

### From the Dashboard (Recommended)

Go to **Settings → Meta Pixel → Page Mappings** in the admin panel. Add the page name and Pixel ID. Changes take effect immediately.

### From Code (Fallback)

Edit `lib/meta-pixel/pixel-mapping.ts`:

```ts
export const PixelMapping = {
  page_a: "111111111111111",
  page_b: "222222222222222",
  page_c: "333333333333333",
  page_d: "444444444444444",  // add here
}
```

Static mappings are merged with runtime dashboard mappings — both work simultaneously.

## Adding a New Event

1. Add the event name to the `MetaEventName` type and `EVENT_NAMES` array in `events.ts`:

```ts
export type MetaEventName =
  | "PageView"
  | "..." 
  | "MyCustomEvent"  // add

export const EVENT_NAMES = [
  "...",
  "MyCustomEvent",
]

export interface MyCustomEventParams {  // add
  myField?: string
  value?: number
}

export type EventParams = {
  ...
  MyCustomEvent: MyCustomEventParams
}
```

2. Track it anywhere:

```ts
track("MyCustomEvent", { myField: "hello", value: 42 })
```

## Usage

### Provider (already integrated in root layout)

The `PixelTrackingProvider` in `provider/pixel-tracking-provider.tsx` is already wired into the root layout. It reads settings from the API and passes them to `PixelProvider`:

```tsx
<PixelProvider
  enabled={settings.meta_pixel_enabled !== "false"}
  defaultPixelId={settings.meta_pixel_default_id}
  debug={settings.meta_pixel_debug === "true"}
/>
```

To control tracking, use `/dashboard/settings/pixel` in the admin panel.

### Manual integration (if needed)

```tsx
import { PixelProvider } from "@/lib/meta-pixel"

<PixelProvider enabled debug={false}>
  {children}
</PixelProvider>
```

### Track events from any component

```tsx
import { usePixelTracking } from "@/lib/meta-pixel"

function CheckoutButton() {
  const { track, attribution } = usePixelTracking()

  return (
    <button onClick={() => {
      track("InitiateCheckout", {
        value: 99.99,
        currency: "BDT",
        num_items: 3,
      })
    }}>
      Checkout
    </button>
  )
}
```

### Purchase tracking

```tsx
track("Purchase", {
  value: 299.99,
  currency: "BDT",
  order_id: "ORD-2706261",
  contents: [
    { id: "PROD-001", quantity: 2, item_price: 99.99 },
    { id: "PROD-002", quantity: 1, item_price: 100.01 },
  ],
  content_ids: ["PROD-001", "PROD-002"],
})
```

### Direct API (without hooks)

```tsx
import { track } from "@/lib/meta-pixel/tracker"

// Automatically detects active Pixel
track("Lead", { value: 50, currency: "BDT" })
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_DEFAULT_PIXEL_ID` | Fallback pixel when no attribution exists |

## Debug Mode

Debug logs are enabled in `development`. Open the browser console to see:

```
[MetaPixel:attribution] { source: "url", data: { pixelId: "111111111111111", ... } }
[MetaPixel:init]         { pixelId: "111111111111111" }
[MetaPixel:event]        { event: "PageView", pixelId: "...", payload: {...} }
[MetaPixel:storage]      { action: "saved", data: {...} }
[MetaPixel:error]        { message: "...", ... }
```

Disable by setting `PIXEL_CONFIG.debug = false` in `config.ts` (auto-disabled in production).

## Testing with Meta Pixel Helper

1. Install the [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebgmmmcjeelkjlkgadmbpodppem) Chrome extension
2. Append `?page=page_a` to your local URL
3. The extension should show Pixel `111111111111111` firing a PageView
4. Navigate and trigger events — verify only the attributed Pixel fires events

## Conversions API Integration (Future)

The architecture is designed for easy CAPI integration:

1. Create `lib/meta-pixel/server.ts` with a `sendEvent(pixelId, eventName, payload)` function
2. Call the Meta Conversions API with your access token
3. In `tracker.ts`, add an optional `sendToServer` parameter to `track()`
4. Example:

```ts
// lib/meta-pixel/server.ts (future)
export async function sendServerEvent(
  pixelId: string,
  eventName: string,
  payload: Record<string, unknown>,
  accessToken: string,
) {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      body: JSON.stringify({
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: window?.location?.href || "",
          ...payload,
        }],
      }),
    },
  )
  return response.json()
}
```

The `eventID` generated client-side enables deduplication between browser and server events.

## Cookie & Storage

- **Cookie**: `_mp_attr` — primary storage, default 30-day expiry
- **localStorage**: `_mp_attr` — fallback when cookies unavailable
- Expiration is configurable via `PIXEL_CONFIG.cookieExpirationDays`

## Troubleshooting

| Issue | Check |
|---|---|
| No events firing | Verify Pixel ID is valid (15-16 digits). Check console for debug logs. |
| Double-counted events | `eventID` deduplication is enabled by default |
| Wrong Pixel ID | Check URL params and stored cookie in DevTools → Application → Cookies |
| Pixel not initializing | Check Meta Pixel Helper extension for errors |
