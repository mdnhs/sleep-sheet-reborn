import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductDetail } from "@/features/(storefront)/data/public-storefront"
import { AddToCart } from "@/features/(storefront)/components/add-to-cart"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productSlug: string }> }): Promise<Metadata> {
  const { slug, productSlug } = await params
  const p = await getProductDetail(slug, productSlug)
  return { title: p ? `${p.name} — ${p.orgName}` : "Product not found" }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params
  const p = await getProductDetail(slug, productSlug)
  if (!p) notFound()

  return (
    <div className="sf-detail">
      <div className="sf-detail-img" style={p.images[0] ? { backgroundImage: `url(${p.images[0]})` } : undefined} />
      <div>
        <h1 className="sf-detail-title">{p.name}</h1>
        {p.description && <p className="sf-detail-desc">{p.description}</p>}
        <AddToCart slug={slug} productName={p.name} variants={p.variants} image={p.images[0] ?? null} />
        <p className="sf-muted" style={{ marginTop: "1.5rem", fontSize: ".85rem" }}>
          <a href={`/store/${slug}`}>← Back to store</a>
        </p>
      </div>
    </div>
  )
}
