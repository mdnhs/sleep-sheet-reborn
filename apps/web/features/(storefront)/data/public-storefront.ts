import "server-only"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import type { D1Database } from "@cloudflare/workers-types"
import { and, eq } from "drizzle-orm"
import {
  createDb, organization, organizationTheme, theme as themeTable,
  menu as menuTable, homepageSection, product, productVariant, productImage,
} from "@repo/database"

const parse = (s: string | null) => { if (!s) return null; try { return JSON.parse(s) as Record<string, unknown> } catch { return null } }

async function getDb() {
  const { env } = await getCloudflareContext({ async: true })
  return createDb((env as { DB: D1Database }).DB)
}

export type ThemeConfig = {
  primaryColor?: string; secondaryColor?: string; logo?: string; favicon?: string; fontFamily?: string
}
export type StorefrontData = {
  org: { id: string; name: string; slug: string }
  theme: { name: string; slug: string; config: ThemeConfig | null } | null
  menus: { location: string; items: Array<{ label: string; url: string }> }[]
  homepage: { id: string; type: string; position: number; config: Record<string, unknown> | null }[]
  products: { id: string; name: string; slug: string; price: number; image: string | null }[]
}

/** Themed storefront data for one tenant (by slug). Published content only. */
export async function getStorefrontData(slug: string): Promise<StorefrontData | null> {
  const db = await getDb()
  const org = await db.select({ id: organization.id, name: organization.name, slug: organization.slug })
    .from(organization).where(eq(organization.slug, slug)).then(r => r[0])
  if (!org) return null

  const active = await db.select().from(organizationTheme)
    .where(and(eq(organizationTheme.organizationId, org.id), eq(organizationTheme.isActive, true)))
    .then(r => r[0])
  let theme: StorefrontData["theme"] = null
  if (active) {
    const t = await db.select().from(themeTable).where(eq(themeTable.id, active.themeId)).then(r => r[0])
    theme = { name: t?.name ?? "Default", slug: t?.slug ?? "default", config: parse(active.config) as ThemeConfig | null }
  }

  const menus = await db.select().from(menuTable).where(eq(menuTable.organizationId, org.id))
  const sections = await db.select().from(homepageSection).where(eq(homepageSection.organizationId, org.id))

  const activeProducts = await db.select({ id: product.id, name: product.name, slug: product.slug })
    .from(product).where(and(eq(product.organizationId, org.id), eq(product.status, "ACTIVE")))
  const products = await Promise.all(activeProducts.slice(0, 12).map(async (p) => {
    const variants = await db.select({ price: productVariant.sellingPrice }).from(productVariant)
      .where(and(eq(productVariant.organizationId, org.id), eq(productVariant.productId, p.id)))
    const img = await db.select({ url: productImage.url }).from(productImage)
      .where(and(eq(productImage.organizationId, org.id), eq(productImage.productId, p.id)))
      .orderBy(productImage.sortOrder).then(r => r[0])
    const prices = variants.map(v => v.price).filter(n => n > 0)
    return { id: p.id, name: p.name, slug: p.slug, price: prices.length ? Math.min(...prices) : 0, image: img?.url ?? null }
  }))

  return {
    org,
    theme,
    menus: menus.map(m => ({ location: m.location, items: (parse(m.items) as unknown as Array<{ label: string; url: string }>) ?? [] })),
    homepage: sections.filter(s => s.enabled).sort((a, b) => a.position - b.position)
      .map(s => ({ id: s.id, type: s.type, position: s.position, config: parse(s.config) })),
    products,
  }
}

export type StorefrontShell = Pick<StorefrontData, "org" | "theme" | "menus">

/** Lightweight shell (theme + nav) for the storefront layout. */
export async function getStorefrontShell(slug: string): Promise<StorefrontShell | null> {
  const db = await getDb()
  const org = await db.select({ id: organization.id, name: organization.name, slug: organization.slug })
    .from(organization).where(eq(organization.slug, slug)).then(r => r[0])
  if (!org) return null
  const active = await db.select().from(organizationTheme)
    .where(and(eq(organizationTheme.organizationId, org.id), eq(organizationTheme.isActive, true))).then(r => r[0])
  let theme: StorefrontData["theme"] = null
  if (active) {
    const t = await db.select().from(themeTable).where(eq(themeTable.id, active.themeId)).then(r => r[0])
    theme = { name: t?.name ?? "Default", slug: t?.slug ?? "default", config: parse(active.config) as ThemeConfig | null }
  }
  const menus = await db.select().from(menuTable).where(eq(menuTable.organizationId, org.id))
  return {
    org, theme,
    menus: menus.map(m => ({ location: m.location, items: (parse(m.items) as unknown as Array<{ label: string; url: string }>) ?? [] })),
  }
}

export type ProductDetail = {
  orgName: string
  id: string; name: string; slug: string; description: string | null
  images: string[]
  variants: { id: string; sku: string; name: string; price: number }[]
}

export async function getProductDetail(slug: string, productSlug: string): Promise<ProductDetail | null> {
  const db = await getDb()
  const org = await db.select({ id: organization.id, name: organization.name })
    .from(organization).where(eq(organization.slug, slug)).then(r => r[0])
  if (!org) return null
  const p = await db.select().from(product)
    .where(and(eq(product.organizationId, org.id), eq(product.slug, productSlug), eq(product.status, "ACTIVE")))
    .then(r => r[0])
  if (!p) return null
  const variants = await db.select({ id: productVariant.id, sku: productVariant.sku, name: productVariant.name, price: productVariant.sellingPrice })
    .from(productVariant).where(and(eq(productVariant.organizationId, org.id), eq(productVariant.productId, p.id)))
  const images = await db.select({ url: productImage.url }).from(productImage)
    .where(and(eq(productImage.organizationId, org.id), eq(productImage.productId, p.id)))
    .orderBy(productImage.sortOrder)
  return {
    orgName: org.name, id: p.id, name: p.name, slug: p.slug, description: p.description,
    images: images.map(i => i.url), variants,
  }
}
