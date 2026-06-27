export const MetaCatalogConfig = {
  feedUrl: "/facebook-feed",
  currency: "BDT",
  country: "BD",
  language: "en",
  brandFallback: "Sleep Sheet",
  cacheDuration: 300,
  titleMaxLength: 150,
  descriptionMaxLength: 5000,
  linkBase: process.env.NEXT_PUBLIC_APP_URL || "https://sleepsheet.com",
  imageBase: process.env.NEXT_PUBLIC_APP_URL || "https://sleepsheet.com",
  availabilityInStock: 1,
  availabilityOutOfStock: 0,
  availabilityPreorder: null,
} as const

export function getFeedConfig() {
  return { ...MetaCatalogConfig }
}
