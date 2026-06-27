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

  defaultPixelId: process.env.NEXT_PUBLIC_DEFAULT_PIXEL_ID || "",

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
