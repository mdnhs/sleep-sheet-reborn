import type { Database } from '@repo/database'
import { createThemesRepository } from '../../repositories/themes.repository'
import { createStorefrontCmsRepository } from '../../repositories/storefront-cms.repository'
import { createProductRepository } from '../../repositories/products.repository'
import { ServiceError } from '../../utils/service-error'

const json = (s: string | null) => { if (!s) return null; try { return JSON.parse(s) } catch { return null } }

/** Public, read-only storefront data for the resolved tenant. Published content only. */
export function createPublicStorefrontService(db: Database, organizationId: string) {
  const themes = createThemesRepository(db, organizationId)
  const cms = createStorefrontCmsRepository(db, organizationId)
  const products = createProductRepository(db, organizationId)

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
      const rows = await products.findMany({ status: 'ACTIVE' })
      return Promise.all(rows.slice(0, limit).map((r: { product: { id: string; name: string; slug: string } }) => productCard(r.product)))
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
  }
}

export type PublicStorefrontService = ReturnType<typeof createPublicStorefrontService>
