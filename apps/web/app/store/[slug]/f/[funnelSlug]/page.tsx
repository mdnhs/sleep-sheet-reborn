import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getFunnelLanding } from "@/features/(storefront)/data/public-storefront"
import { FunnelCTA } from "@/features/(storefront)/components/funnel-cta"

export const dynamic = "force-dynamic"

const str = (c: Record<string, unknown> | null, k: string, d = "") => (typeof c?.[k] === "string" ? (c[k] as string) : d)
const taka = (n: number) => `৳${n.toLocaleString()}`

export async function generateMetadata({ params }: { params: Promise<{ slug: string; funnelSlug: string }> }): Promise<Metadata> {
  const { slug, funnelSlug } = await params
  const f = await getFunnelLanding(slug, funnelSlug)
  return { title: f ? str(f.landing, "headline", f.name) : "Offer not found" }
}

export default async function FunnelLandingPage({ params }: { params: Promise<{ slug: string; funnelSlug: string }> }) {
  const { slug, funnelSlug } = await params
  const f = await getFunnelLanding(slug, funnelSlug)
  if (!f) notFound()

  const cfg = f.landing
  const cta = str(cfg, "ctaLabel", "Order now")

  return (
    <section className="sf-hero">
      <h1 className="sf-hero-title">{str(cfg, "headline", f.name)}</h1>
      {str(cfg, "subheadline") && <p className="sf-hero-sub">{str(cfg, "subheadline")}</p>}

      {f.product && (
        <div style={{ maxWidth: 420, margin: "2rem auto", textAlign: "center" }}>
          {f.product.image && <div className="sf-detail-img" style={{ backgroundImage: `url(${f.product.image})`, marginBottom: "1rem" }} />}
          <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{f.product.name}</p>
          <p className="sf-detail-price">{taka(f.product.price)}</p>
        </div>
      )}

      <FunnelCTA slug={slug} funnelId={f.funnelId} product={f.product} ctaLabel={cta} />
      {str(cfg, "footnote") && <p className="sf-muted" style={{ marginTop: "1.5rem" }}>{str(cfg, "footnote")}</p>}
    </section>
  )
}
