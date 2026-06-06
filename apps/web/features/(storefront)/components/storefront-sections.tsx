import type { StorefrontData } from "../data/public-storefront"

type Section = StorefrontData["homepage"][number]
type Product = StorefrontData["products"][number]
const str = (c: Record<string, unknown> | null, k: string, d = "") => (typeof c?.[k] === "string" ? (c[k] as string) : d)
const taka = (n: number) => `৳${n.toLocaleString()}`

function ProductGrid({ slug, products }: { slug: string; products: Product[] }) {
  if (!products.length) return <p className="sf-muted">No products yet.</p>
  return (
    <div className="sf-grid">
      {products.map(p => (
        <a key={p.id} href={`/store/${slug}/products/${p.slug}`} className="sf-card">
          <div className="sf-card-img" style={p.image ? { backgroundImage: `url(${p.image})` } : undefined} />
          <div className="sf-card-body">
            <span className="sf-card-name">{p.name}</span>
            <span className="sf-card-price">{taka(p.price)}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

export function StorefrontSection({ slug, section, products }: { slug: string; section: Section; products: Product[] }) {
  const c = section.config
  switch (section.type) {
    case "HERO":
      return (
        <section className="sf-hero">
          <h1 className="sf-hero-title">{str(c, "title", "Welcome")}</h1>
          {str(c, "subtitle") && <p className="sf-hero-sub">{str(c, "subtitle")}</p>}
          {str(c, "buttonLabel") && <a className="sf-btn" href={str(c, "buttonUrl", "#")}>{str(c, "buttonLabel")}</a>}
        </section>
      )
    case "BANNER":
      return <section className="sf-banner">{str(c, "text", "")}</section>
    case "CUSTOM_HTML":
      return <section className="sf-custom" dangerouslySetInnerHTML={{ __html: str(c, "html") }} />
    case "FEATURED_PRODUCTS":
    case "BEST_SELLERS":
    case "FLASH_SALE":
      return (
        <section className="sf-section">
          <h2 className="sf-section-title">{str(c, "title", section.type === "BEST_SELLERS" ? "Best Sellers" : "Featured")}</h2>
          <ProductGrid slug={slug} products={products} />
        </section>
      )
    case "CATEGORY_GRID":
    case "TESTIMONIALS":
    case "BLOG_POSTS":
    default:
      return (
        <section className="sf-section">
          <h2 className="sf-section-title">{str(c, "title", section.type.replace(/_/g, " "))}</h2>
        </section>
      )
  }
}
