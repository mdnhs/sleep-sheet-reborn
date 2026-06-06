import type { Database } from '@repo/database'
import { createThemesRepository } from '../../repositories/themes.repository'
import { createStorefrontCmsRepository } from '../../repositories/storefront-cms.repository'
import { createProductRepository } from '../../repositories/products.repository'
import { createCategoryRepository } from '../../repositories/categories.repository'
import { createProductVariantRepository } from '../../repositories/product-variants.repository'
import { createLocationRepository } from '../../repositories/locations.repository'
import { createCustomersRepository } from '../../repositories/customers.repository'
import { createOrdersService } from '../v1/orders.service'
import { ServiceError } from '../../utils/service-error'

const json = (s: string | null) => { if (!s) return null; try { return JSON.parse(s) } catch { return null } }

/** Public, read-only storefront data for the resolved tenant. Published content only. */
export function createPublicStorefrontService(db: Database, organizationId: string) {
  const themes = createThemesRepository(db, organizationId)
  const cms = createStorefrontCmsRepository(db, organizationId)
  const products = createProductRepository(db, organizationId)
  const categories = createCategoryRepository(db, organizationId)
  const variants = createProductVariantRepository(db, organizationId)
  const locations = createLocationRepository(db, organizationId)
  const customers = createCustomersRepository(db, organizationId)

  async function productCard(p: { id: string; name: string; slug: string }) {
    const [variants, images] = await Promise.all([products.findVariants(p.id), products.findImages(p.id)])
    const prices = variants.map((v: { sellingPrice: number }) => v.sellingPrice).filter((n: number) => n > 0)
    return {
      id: p.id, name: p.name, slug: p.slug,
      price: prices.length ? Math.min(...prices) : 0,
      image: images[0]?.url ?? null,
    }
  }

  return {
    /** Theme config + navigation + homepage layout for rendering the shell. */
    async getStorefront() {
      const active = await themes.findActive()
      let theme: { id: string; name: string; slug: string; config: unknown } | null = null
      if (active) {
        const catalog = await themes.findTheme(active.themeId)
        theme = { id: active.themeId, name: catalog?.name ?? 'Default', slug: catalog?.slug ?? 'default', config: json(active.config) }
      }
      const [menus, sections] = await Promise.all([cms.findMenus(), cms.findSections()])
      return {
        theme,
        menus: menus.map(m => ({ location: m.location, name: m.name, items: json(m.items) ?? [] })),
        homepage: sections.filter(s => s.enabled).map(s => ({ id: s.id, type: s.type, position: s.position, config: json(s.config) })),
      }
    },

    async listProducts(limit = 24) {
      const rows = await products.findMany({ status: 'ACTIVE', limit })
      return Promise.all(rows.map((r: { product: { id: string; name: string; slug: string } }) => productCard(r.product)))
    },

    async listCategories() {
      const rows = await categories.findMany()
      return rows.map((c: { id: string; name: string; slug: string }) => ({ id: c.id, name: c.name, slug: c.slug }))
    },

    /** Paginated catalog browse with optional text search and category filter. */
    async browseProducts(opts: { search?: string; categorySlug?: string; limit?: number; offset?: number } = {}) {
      const limit = Math.min(opts.limit ?? 24, 60)
      const offset = Math.max(opts.offset ?? 0, 0)
      let categoryId: string | undefined
      if (opts.categorySlug) {
        const cat = await categories.findBySlug(opts.categorySlug)
        if (!cat) return { items: [], total: 0, limit, offset }
        categoryId = cat.id
      }
      const query = { status: 'ACTIVE' as const, categoryId, search: opts.search, limit, offset }
      const [rows, total] = await Promise.all([products.findMany(query), products.count(query)])
      const items = await Promise.all(rows.map((r: { product: { id: string; name: string; slug: string } }) => productCard(r.product)))
      return { items, total, limit, offset }
    },

    async getProduct(slug: string) {
      const p = await products.findBySlug(slug)
      if (!p || p.status !== 'ACTIVE') throw new ServiceError('Product not found', 404)
      const [variants, images] = await Promise.all([products.findVariants(p.id), products.findImages(p.id)])
      return {
        id: p.id, name: p.name, slug: p.slug, description: p.description,
        images: images.map((i: { url: string }) => i.url),
        variants: variants.map((v: { id: string; sku: string; name: string; sellingPrice: number }) => ({ id: v.id, sku: v.sku, name: v.name, price: v.sellingPrice })),
      }
    },

    async getPage(slug: string) {
      const page = await cms.findPageBySlug(slug)
      if (!page || page.status !== 'PUBLISHED') throw new ServiceError('Page not found', 404)
      return {
        title: page.title, slug: page.slug, content: page.content,
        seo: { metaTitle: page.metaTitle, metaDescription: page.metaDescription, ogImage: page.ogImage, canonicalUrl: page.canonicalUrl },
      }
    },

    async listBlog() {
      const posts = await cms.findPosts('PUBLISHED')
      return posts.map(p => ({ title: p.title, slug: p.slug, excerpt: p.excerpt, coverImage: p.coverImage, category: p.category, publishedAt: p.publishedAt }))
    },

    async getPost(slug: string) {
      const p = await cms.findPostBySlug(slug)
      if (!p || p.status !== 'PUBLISHED') throw new ServiceError('Post not found', 404)
      return {
        title: p.title, slug: p.slug, content: p.content, coverImage: p.coverImage, category: p.category, publishedAt: p.publishedAt,
        seo: { metaTitle: p.metaTitle, metaDescription: p.metaDescription, ogImage: p.ogImage },
      }
    },

    /**
     * Guest/direct checkout. Prices are resolved server-side (never trusted from the
     * client); fulfillment falls to the first active location; customer is matched or
     * created by phone. Stock + reservations handled by the Orders service.
     */
    async createOrder(data: {
      items: Array<{ variantId: string; quantity: number }>
      customer: { name: string; phone: string; email?: string; address: string; area?: string; city: string }
      paymentMethod?: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'BANK' | 'WALLET'
      notes?: string
    }) {
      if (!data.items?.length) throw new ServiceError('Cart is empty', 400)
      const activeLocations = await locations.findLocations()
      const location = activeLocations[0]
      if (!location) throw new ServiceError('Store is not accepting orders right now', 400)

      const lineItems: Array<{ variantId: string; quantity: number; unitPrice: number }> = []
      for (const it of data.items) {
        if (!it.quantity || it.quantity <= 0) throw new ServiceError('Invalid quantity', 400)
        const v = await variants.findById(it.variantId)
        if (!v || v.status !== 'ACTIVE') throw new ServiceError('An item in your cart is unavailable', 404)
        lineItems.push({ variantId: it.variantId, quantity: it.quantity, unitPrice: v.sellingPrice })
      }

      const existing = await customers.findByPhone(data.customer.phone)
      const customerId = existing?.id
        ?? (await customers.create({ name: data.customer.name, phone: data.customer.phone, email: data.customer.email ?? null })).id

      const orders = createOrdersService(db, organizationId)
      const order = await orders.create({
        items: lineItems,
        address: { name: data.customer.name, phone: data.customer.phone, address: data.customer.address, area: data.customer.area, city: data.customer.city },
        locationId: location.id,
        source: 'WEBSITE',
        paymentMethod: data.paymentMethod ?? 'COD',
        customerId,
        customerNotes: data.notes,
      })
      return { orderId: order.id, orderNumber: order.orderNumber, grandTotal: order.grandTotal, status: order.status }
    },
  }
}

export type PublicStorefrontService = ReturnType<typeof createPublicStorefrontService>
