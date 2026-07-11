export const seoConfig = {
  siteName: "Sleep Sheet",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://sleepsheetbd.com",
  defaultTitle: "Sleep Sheet - Premium Bedding & Sleep Solutions",
  defaultDescription:
    "Discover premium bedding, comforters, mattresses, pillows, and sleep accessories. Shop the best sleep products for ultimate comfort and relaxation.",
  defaultImage: "/og-default.jpg",
  defaultLocale: "en_US",
  twitterHandle: "@sleepsheet2025",
  themeColor: "#0f172a",
  organization: {
    name: "Sleep Sheet",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://sleepsheetbd.com",
    logo: "/logo.png",
    description: "Premium bedding and sleep solutions provider.",
    foundingDate: "2024",
    founders: [],
    sameAs: [
      "https://facebook.com/sleepsheet2025",
      "https://instagram.com/sleepsheet2025",
      "https://twitter.com/sleepsheet2025",
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
    facebook: "https://facebook.com/sleepsheet2025",
    instagram: "https://instagram.com/sleepsheet2025",
    twitter: "https://twitter.com/sleepsheet2025",
    pinterest: "https://pinterest.com/sleepsheet2025",
    youtube: "https://youtube.com/@sleepsheet2025",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
  },
};
