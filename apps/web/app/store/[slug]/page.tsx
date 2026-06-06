import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStorefrontData } from "@/features/(storefront)/data/public-storefront"
import { StorefrontSection } from "@/features/(storefront)/components/storefront-sections"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getStorefrontData(slug)
  return { title: data ? `${data.org.name} — Store` : "Store not found" }
}

export default async function StorefrontHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getStorefrontData(slug)
  if (!data) notFound()

  const cfg = data.theme?.config ?? {}
  const themeVars = {
    "--sf-primary": cfg.primaryColor ?? "#111827",
    "--sf-secondary": cfg.secondaryColor ?? "#6b7280",
    "--sf-font": cfg.fontFamily ?? "system-ui, sans-serif",
  } as CSSProperties
  const header = data.menus.find(m => m.location === "HEADER")
  const footer = data.menus.find(m => m.location === "FOOTER")

  return (
    <div className="sf-root" style={themeVars}>
      <style>{STYLES}</style>

      <header className="sf-header">
        <span className="sf-brand">{cfg.logo ? <img src={cfg.logo} alt={data.org.name} className="sf-logo" /> : data.org.name}</span>
        <nav className="sf-nav">
          {(header?.items ?? []).map((i, idx) => <a key={idx} href={i.url}>{i.label}</a>)}
        </nav>
      </header>

      <main>
        {!data.theme ? (
          <section className="sf-section"><p className="sf-muted">No theme activated for this store yet.</p></section>
        ) : !data.homepage.length ? (
          <section className="sf-hero"><h1 className="sf-hero-title">{data.org.name}</h1><p className="sf-hero-sub">Storefront coming soon.</p></section>
        ) : (
          data.homepage.map(s => <StorefrontSection key={s.id} section={s} products={data.products} />)
        )}
      </main>

      <footer className="sf-footer">
        <nav className="sf-nav">
          {(footer?.items ?? []).map((i, idx) => <a key={idx} href={i.url}>{i.label}</a>)}
        </nav>
        <p className="sf-muted">© {new Date().getFullYear()} {data.org.name}. Powered by the platform.</p>
      </footer>
    </div>
  )
}

const STYLES = `
.sf-root { font-family: var(--sf-font); color: #111; background: #fff; min-height: 100vh; }
.sf-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; border-bottom: 1px solid #eee; }
.sf-brand { font-weight: 700; font-size: 1.25rem; color: var(--sf-primary); }
.sf-logo { height: 32px; }
.sf-nav { display: flex; gap: 1.25rem; }
.sf-nav a { color: var(--sf-secondary); text-decoration: none; font-size: .9rem; }
.sf-nav a:hover { color: var(--sf-primary); }
.sf-hero { text-align: center; padding: 5rem 2rem; background: linear-gradient(180deg,#fafafa,#fff); }
.sf-hero-title { font-size: 2.75rem; font-weight: 800; color: var(--sf-primary); margin: 0; }
.sf-hero-sub { color: var(--sf-secondary); margin-top: .75rem; font-size: 1.1rem; }
.sf-btn { display: inline-block; margin-top: 1.5rem; padding: .7rem 1.5rem; background: var(--sf-primary); color: #fff; border-radius: 8px; text-decoration: none; }
.sf-banner { background: var(--sf-primary); color: #fff; text-align: center; padding: .75rem; }
.sf-section { padding: 3rem 2rem; max-width: 1100px; margin: 0 auto; }
.sf-section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; text-transform: capitalize; }
.sf-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 1.25rem; }
.sf-card { display: block; border: 1px solid #eee; border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow .15s; }
.sf-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.08); }
.sf-card-img { aspect-ratio: 1; background: #f3f4f6 center/cover no-repeat; }
.sf-card-body { padding: .75rem 1rem; display: flex; flex-direction: column; gap: .25rem; }
.sf-card-name { font-weight: 600; font-size: .95rem; }
.sf-card-price { color: var(--sf-primary); font-weight: 700; }
.sf-muted { color: var(--sf-secondary); }
.sf-footer { border-top: 1px solid #eee; padding: 2rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center; }
.sf-custom { padding: 2rem; }
`
