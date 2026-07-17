import { seoConfig } from "./config"
import { db } from "@/db"
import { products, posts, categories } from "@/db/schema"
import { count, desc, gt } from "drizzle-orm"

interface SitemapEntry {
  url: string
  lastModified?: string
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
  images?: Array<{ url: string; caption?: string; title?: string }>
}

function sitemapEntry(entry: SitemapEntry): string {
  const parts = [`  <url>`]
  parts.push(`    <loc>${entry.url}</loc>`)
  if (entry.lastModified) {
    parts.push(`    <lastmod>${entry.lastModified}</lastmod>`)
  }
  if (entry.changeFrequency) {
    parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`)
  }
  if (entry.priority !== undefined) {
    parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
  }
  if (entry.images?.length) {
    for (const img of entry.images) {
      parts.push(`    <image:image>`)
      parts.push(`      <image:loc>${img.url}</image:loc>`)
      if (img.caption) parts.push(`      <image:caption>${img.caption}</image:caption>`)
      if (img.title) parts.push(`      <image:title>${img.title}</image:title>`)
      parts.push(`    </image:image>`)
    }
  }
  parts.push(`  </url>`)
  return parts.join("\n")
}

function buildSitemapIndex(sitemaps: string[]): string {
  const entries = sitemaps
    .map((s) => `  <sitemap><loc>${seoConfig.siteUrl}${s}</loc></sitemap>`)
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`
}

function buildSitemap(entries: SitemapEntry[], includeImageNs = false): string {
  const xmlns = "http://www.sitemaps.org/schemas/sitemap/0.9"
  const imageNs = includeImageNs ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""
  const body = entries.map(sitemapEntry).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${xmlns}"${imageNs}>\n${body}\n</urlset>`
}

export async function generateMainSitemap() {
  const [productCount] = await db.select({ count: count() }).from(products)
  const [categoryCount] = await db.select({ count: count() }).from(categories)
  const [postCount] = await db.select({ count: count() }).from(posts)

  return buildSitemapIndex([
    "/sitemap-pages.xml",
    "/sitemap-products.xml",
    "/sitemap-categories.xml",
    ...(Number(postCount.count) > 0 ? ["/sitemap-blogs.xml"] : []),
    ...(Number(productCount.count) > 0 ? ["/sitemap-images.xml"] : []),
  ])
}

export async function generatePagesSitemap() {
  const now = new Date().toISOString()
  // Legal pages carry a real "Last updated" date printed on the page itself
  // (see app/(client)/terms-of-service, /privacy-policy, /shipping-returns) —
  // the sitemap should say the same thing, not always claim "modified today".
  const legalLastModified = new Date("2026-07-17").toISOString()
  const staticPages = [
    { url: `${seoConfig.siteUrl}`, priority: 1.0, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/shop`, priority: 0.9, changeFrequency: "daily" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/new-arrivals`, priority: 0.8, changeFrequency: "daily" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/bestsellers`, priority: 0.8, changeFrequency: "daily" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/blog`, priority: 0.8, changeFrequency: "daily" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/about`, priority: 0.5, changeFrequency: "yearly" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/contact`, priority: 0.5, changeFrequency: "yearly" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/track-order`, priority: 0.3, changeFrequency: "monthly" as const, lastModified: now },
    { url: `${seoConfig.siteUrl}/terms-of-service`, priority: 0.3, changeFrequency: "yearly" as const, lastModified: legalLastModified },
    { url: `${seoConfig.siteUrl}/privacy-policy`, priority: 0.3, changeFrequency: "yearly" as const, lastModified: legalLastModified },
    { url: `${seoConfig.siteUrl}/shipping-returns`, priority: 0.4, changeFrequency: "yearly" as const, lastModified: legalLastModified },
  ]

  return buildSitemap(
    staticPages.map((p) => ({
      url: p.url,
      lastModified: p.lastModified,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
  )
}

export async function generateProductsSitemap() {
  const allItems = await db
    .select({ id: products.id, name: products.name, updatedAt: products.updatedAt })
    .from(products)

  return buildSitemap(
    allItems.map((p) => ({
      url: `${seoConfig.siteUrl}/shop/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  )
}

export async function generateCategoriesSitemap() {
  const allItems = await db
    .select({ id: categories.id, label: categories.label, value: categories.value, updatedAt: categories.updatedAt })
    .from(categories)

  return buildSitemap(
    allItems.map((c) => ({
      url: `${seoConfig.siteUrl}/categories/${c.value || c.id}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  )
}

export async function generateBlogsSitemap() {
  const allPosts = await db
    .select({ id: posts.id, title: posts.title, slug: posts.slug, updatedAt: posts.updatedAt, isPublished: posts.isPublished })
    .from(posts)
    .where(gt(posts.createdAt, new Date(0)))

  return buildSitemap(
    allPosts.map((p) => ({
      url: `${seoConfig.siteUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  )
}

export async function generateImagesSitemap() {
  const allItems = await db
    .select({
      id: products.id,
      name: products.name,
      images: products.images,
    })
    .from(products)

  const entries: SitemapEntry[] = []
  for (const p of allItems) {
    const productUrl = `${seoConfig.siteUrl}/shop/${p.id}`
    const allImages = (p.images || []).filter(Boolean) as string[]
    if (allImages.length > 0) {
      entries.push({
        url: productUrl,
        changeFrequency: "weekly",
        priority: 0.5,
        images: allImages.map((img) => ({ url: img, caption: p.name, title: p.name })),
      })
    }
  }

  return buildSitemap(entries, true)
}
