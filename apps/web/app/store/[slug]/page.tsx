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

  if (!data.theme) return <section className="sf-section"><p className="sf-muted">No theme activated for this store yet.</p></section>
  if (!data.homepage.length) {
    return <section className="sf-hero"><h1 className="sf-hero-title">{data.org.name}</h1><p className="sf-hero-sub">Storefront coming soon.</p></section>
  }
  return <>{data.homepage.map(s => <StorefrontSection key={s.id} slug={slug} section={s} products={data.products} />)}</>
}
