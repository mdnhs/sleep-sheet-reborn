import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCatalog } from "@/features/(storefront)/data/public-storefront"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: `Shop — ${slug}` }
}

const taka = (n: number) => `৳${n.toLocaleString()}`

export default async function ShopPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ search?: string; category?: string; page?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(Number(sp.page ?? 1) || 1, 1)
  const data = await getCatalog(slug, { search: sp.search, category: sp.category, page })
  if (!data) notFound()

  const base = `/store/${slug}/shop`
  const totalPages = Math.max(Math.ceil(data.total / data.limit), 1)
  const qp = (over: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams()
    const merged = { search: data.search, category: data.category, ...over }
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, String(v))
    const s = u.toString()
    return s ? `${base}?${s}` : base
  }

  return (
    <div className="sf-section">
      <h1 className="sf-section-title">Shop</h1>

      <form action={base} method="get" style={{ marginBottom: "1.25rem", display: "flex", gap: ".5rem" }}>
        {data.category && <input type="hidden" name="category" value={data.category} />}
        <input className="sf-input" name="search" placeholder="Search products…" defaultValue={data.search} style={{ maxWidth: 320, marginBottom: 0 }} />
        <button className="sf-btn" type="submit">Search</button>
      </form>

      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <a className={`sf-chip${!data.category ? " sf-chip-on" : ""}`} href={qp({ category: undefined, page: undefined })}>All</a>
        {data.categories.map(c => (
          <a key={c.id} className={`sf-chip${data.category === c.slug ? " sf-chip-on" : ""}`} href={qp({ category: c.slug, page: undefined })}>{c.name}</a>
        ))}
      </div>

      {!data.items.length ? (
        <p className="sf-muted">No products found.</p>
      ) : (
        <div className="sf-grid">
          {data.items.map(p => (
            <a key={p.id} href={`/store/${slug}/products/${p.slug}`} className="sf-card">
              <div className="sf-card-img" style={p.image ? { backgroundImage: `url(${p.image})` } : undefined} />
              <div className="sf-card-body">
                <span className="sf-card-name">{p.name}</span>
                <span className="sf-card-price">{taka(p.price)}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", marginTop: "2rem", alignItems: "center" }}>
          {page > 1 && <a className="sf-btn sf-btn-outline" href={qp({ page: page - 1 })}>← Prev</a>}
          <span className="sf-muted">Page {page} of {totalPages}</span>
          {page < totalPages && <a className="sf-btn sf-btn-outline" href={qp({ page: page + 1 })}>Next →</a>}
        </div>
      )}

      <style>{`.sf-chip{padding:.4rem .9rem;border:1px solid #ddd;border-radius:999px;text-decoration:none;color:var(--sf-secondary);font-size:.85rem}.sf-chip-on{background:var(--sf-primary);color:#fff;border-color:var(--sf-primary)}`}</style>
    </div>
  )
}
