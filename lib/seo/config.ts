export const seoConfig = {
  siteName: "Sleep Sheet Reborn",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://sleepsheet.com",
  defaultTitle: "Sleep Sheet Reborn - Premium Bedding & Sleep Solutions",
  defaultDescription:
    "Discover premium bedding, mattresses, pillows, and sleep accessories. Shop the best sleep products for ultimate comfort and relaxation.",
  defaultImage: "/og-default.jpg",
  defaultLocale: "en_US",
  twitterHandle: "@sleepsheet",
  themeColor: "#0f172a",
  organization: {
    name: "Sleep Sheet Reborn",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://sleepsheet.com",
    logo: "/logo.png",
    description: "Premium bedding and sleep solutions provider.",
    foundingDate: "2024",
    founders: [],
    sameAs: [
      "https://facebook.com/sleepsheet",
      "https://instagram.com/sleepsheet",
      "https://twitter.com/sleepsheet",
    ],
  },
  address: {
    streetAddress: "123 Sleep Street",
    addressLocality: "Dhaka",
    addressRegion: "Dhaka",
    postalCode: "1205",
    addressCountry: "BD",
  },
  contact: {
    telephone: "+880-1234-567890",
    email: "hello@sleepsheet.com",
    contactType: "customer service",
  },
  socialLinks: {
    facebook: "https://facebook.com/sleepsheet",
    instagram: "https://instagram.com/sleepsheet",
    twitter: "https://twitter.com/sleepsheet",
    pinterest: "https://pinterest.com/sleepsheet",
    youtube: "https://youtube.com/@sleepsheet",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
  },
};
