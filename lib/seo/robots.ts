import { seoConfig } from "./config"

interface RobotsConfig {
  allowAll?: boolean
  disallowPaths?: string[]
  additionalRules?: string[]
  sitemaps?: string[]
}

export function generateRobotsTxt(config: RobotsConfig = {}): string {
  const {
    allowAll = true,
    disallowPaths = [],
    additionalRules = [],
    sitemaps = [],
  } = config

  const lines: string[] = []

  if (allowAll) {
    lines.push("User-agent: *")
    lines.push("Allow: /")
  }

  for (const path of disallowPaths) {
    lines.push(`Disallow: ${path}`)
  }

  if (additionalRules.length > 0) {
    lines.push("")
    lines.push(...additionalRules)
  }

  const allSitemaps = [
    ...sitemaps,
    `${seoConfig.siteUrl}/sitemap.xml`,
  ]

  for (const sitemap of allSitemaps) {
    lines.push("")
    lines.push(`Sitemap: ${sitemap}`)
  }

  return lines.join("\n")
}

export function defaultRobotsTxt(): string {
  return generateRobotsTxt({
    allowAll: true,
    disallowPaths: [
      "/api/",
      "/dashboard/",
      "/_next/",
      "/account/",
      "/checkout/",
      "/orders/",
      "/order-success/",
      "/track-order/",
    ],
    additionalRules: [
      "User-agent: GPTBot",
      "Disallow: /",
      "",
      "User-agent: ChatGPT-User",
      "Disallow: /",
      "",
      "User-agent: Google-Extended",
      "Disallow: /",
      "",
      "User-agent: CCBot",
      "Disallow: /",
    ],
  })
}
