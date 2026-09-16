export interface PixelRuntimeConfig {
  debug: boolean
  defaultPixelId: string
  cookieName: string
  cookieExpirationDays: number
  sdkUrl: string
  attributionParams: {
    pixel: string
    page: string
    campaign: string
    source: string
    medium: string
    term: string
    content: string
  }
}

export const PIXEL_CONFIG: PixelRuntimeConfig = {
  debug: process.env.NODE_ENV === "development",

  // Empty by default, and deliberately not read from an env var.
  //
  // This used to fall back to NEXT_PUBLIC_DEFAULT_PIXEL_ID. That variable was
  // the one thing standing between the app's own Pixel and the Meta Pixel
  // tags already in the GTM container: with no pixel id, getActivePixelId()
  // returns null and the SDK is never loaded, so setting it anywhere — a
  // deploy env, a preview branch, a copied .env — would have been enough to
  // start double-counting PageView, ViewContent, AddToCart, InitiateCheckout,
  // Purchase and Search.
  //
  // The real value arrives through applyPixelOverrides() from the
  // meta_pixel_default_id admin setting, so the database stays the single
  // place this is configured.
  defaultPixelId: "",

  cookieName: "_mp_attr",

  cookieExpirationDays: 30,

  attributionParams: {
    pixel: "pixel",
    page: "page",
    campaign: "utm_campaign",
    source: "utm_source",
    medium: "utm_medium",
    term: "utm_term",
    content: "utm_content",
  },

  sdkUrl: "https://connect.facebook.net/en_US/fbevents.js",
}

export function applyPixelOverrides(overrides: Partial<PixelRuntimeConfig>): void {
  Object.assign(PIXEL_CONFIG, overrides)
}
