"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "./storefront-cart"

type Product = { slug: string; name: string; price: number; image: string | null; variantId: string | null }

/** Tracks the funnel visit on mount and drives direct checkout for the offer. */
export function FunnelCTA({ slug, funnelId, product, ctaLabel }: { slug: string; funnelId: string; product: Product | null; ctaLabel: string }) {
  const { add } = useCart(slug)
  const router = useRouter()

  useEffect(() => {
    const utm = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
    fetch(`/api/public/funnels/${funnelId}/track`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utmSource: utm.get("utm_source") ?? undefined,
        utmMedium: utm.get("utm_medium") ?? undefined,
        utmCampaign: utm.get("utm_campaign") ?? undefined,
      }),
    }).catch(() => {})
  }, [funnelId])

  if (!product || !product.variantId) return <p className="sf-muted">This offer is currently unavailable.</p>

  return (
    <button className="sf-btn" style={{ fontSize: "1.05rem", padding: ".9rem 2rem" }} onClick={() => {
      add({ variantId: product.variantId!, name: product.name, variantName: "Default", price: product.price, image: product.image })
      router.push(`/store/${slug}/checkout?funnel=${funnelId}`)
    }}>{ctaLabel}</button>
  )
}
