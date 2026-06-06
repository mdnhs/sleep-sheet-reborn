import "server-only"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import type { D1Database } from "@cloudflare/workers-types"
import { and, eq, like, sql } from "drizzle-orm"
import {
  createDb, organization, organizationTheme, theme as themeTable,
  menu as menuTable, homepageSection, product, productVariant, productImage, category,
  funnel as funnelTable, funnelStep,
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

type ProductCard = { id: string; name: string; slug: string; price: number; image: string | null }
export type Catalog = {
  org: { name: string }
  items: ProductCard[]
  total: number; limit: number; offset: number
  categories: { id: string; name: string; slug: string }[]
  search: string; category: string
}

async function cardFor(db: Awaited<ReturnType<typeof getDb>>, orgId: string, p: { id: string; name: string; slug: string }): Promise<ProductCard> {
  const variants = await db.select({ price: productVariant.sellingPrice }).from(productVariant)
    .where(and(eq(productVariant.organizationId, orgId), eq(productVariant.productId, p.id)))
  const img = await db.select({ url: productImage.url }).from(productImage)
    .where(and(eq(productImage.organizationId, orgId), eq(productImage.productId, p.id)))
    .orderBy(productImage.sortOrder).then(r => r[0])
  const prices = variants.map(v => v.price).filter(n => n > 0)
  return { id: p.id, name: p.name, slug: p.slug, price: prices.length ? Math.min(...prices) : 0, image: img?.url ?? null }
}

export async function getCatalog(slug: string, opts: { search?: string; category?: string; page?: number } = {}): Promise<Catalog | null> {
  const db = await getDb()
  const org = await db.select({ id: organization.id, name: organization.name })
    .from(organization).where(eq(organization.slug, slug)).then(r => r[0])
  if (!org) return null

  const limit = 24
  const offset = Math.max((opts.page ?? 1) - 1, 0) * limit
  const cats = await db.select({ id: category.id, name: category.name, slug: category.slug })
    .from(category).where(and(eq(category.organizationId, org.id), eq(category.status, "ACTIVE")))

  const conds = [eq(product.organizationId, org.id), eq(product.status, "ACTIVE")]
  if (opts.search) conds.push(like(product.name, `%${opts.search}%`))
  if (opts.category) {
    const cat = cats.find(c => c.slug === opts.category)
    if (!cat) return { org: { name: org.name }, items: [], total: 0, limit, offset, categories: cats, search: opts.search ?? "", category: opts.category }
    conds.push(eq(product.categoryId, cat.id))
  }

  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(product).where(and(...conds))
  const rows = await db.select({ id: product.id, name: product.name, slug: product.slug })
    .from(product).where(and(...conds)).limit(limit).offset(offset)
  const items = await Promise.all(rows.map(r => cardFor(db, org.id, r)))
  return { org: { name: org.name }, items, total: total ?? 0, limit, offset, categories: cats, search: opts.search ?? "", category: opts.category ?? "" }
}

export type ProductDetail = {
  orgName: string
  id: string; name: string; slug: string; description: string | null
  images: string[]
  variants: { id: string; sku: string; name: string; price: number }[]
}

export type FunnelLanding = {
  funnelId: string; name: string; type: string
  landing: Record<string, unknown> | null
  product: { slug: string; name: string; price: number; image: string | null; variantId: string | null } | null
}

export async function getFunnelLanding(slug: string, funnelSlug: string): Promise<FunnelLanding | null> {
  const db = await getDb()
  const org = await db.select({ id: organization.id }).from(organization).where(eq(organization.slug, slug)).then(r => r[0])
  if (!org) return null
  const f = await db.select().from(funnelTable)
    .where(and(eq(funnelTable.organizationId, org.id), eq(funnelTable.slug, funnelSlug), eq(funnelTable.status, "ACTIVE")))
    .then(r => r[0])
  if (!f) return null
  const steps = await db.select().from(funnelStep)
    .where(and(eq(funnelStep.organizationId, org.id), eq(funnelStep.funnelId, f.id))).orderBy(funnelStep.position)
  const landingCfg = parse(steps.find(s => s.type === "LANDING")?.config ?? null)

  let card: FunnelLanding["product"] = null
  const productSlug = typeof landingCfg?.productSlug === "string" ? landingCfg.productSlug : null
  if (productSlug) {
    const p = await db.select().from(product)
      .where(and(eq(product.organizationId, org.id), eq(product.slug, productSlug), eq(product.status, "ACTIVE"))).then(r => r[0])
    if (p) {
      const vs = await db.select({ id: productVariant.id, price: productVariant.sellingPrice }).from(productVariant)
        .where(and(eq(productVariant.organizationId, org.id), eq(productVariant.productId, p.id)))
      const img = await db.select({ url: productImage.url }).from(productImage)
        .where(and(eq(productImage.organizationId, org.id), eq(productImage.productId, p.id))).orderBy(productImage.sortOrder).then(r => r[0])
      const prices = vs.map(v => v.price).filter(n => n > 0)
      card = { slug: p.slug, name: p.name, price: prices.length ? Math.min(...prices) : 0, image: img?.url ?? null, variantId: vs[0]?.id ?? null }
    }
  }
  return { funnelId: f.id, name: f.name, type: f.type, landing: landingCfg, product: card }
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
