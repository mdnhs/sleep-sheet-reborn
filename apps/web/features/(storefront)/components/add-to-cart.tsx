"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "./storefront-cart"

type Variant = { id: string; sku: string; name: string; price: number }

const taka = (n: number) => `৳${n.toLocaleString()}`

export function AddToCart({ slug, productName, variants, image }: { slug: string; productName: string; variants: Variant[]; image: string | null }) {
  const { add } = useCart(slug)
  const router = useRouter()
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "")
  const [added, setAdded] = useState(false)
  const selected = variants.find(v => v.id === variantId) ?? variants[0]

  if (!variants.length) return <p className="sf-muted">Out of stock.</p>

  return (
    <div className="sf-buy">
      {variants.length > 1 && (
        <select className="sf-select" value={variantId} onChange={e => setVariantId(e.target.value)}>
          {variants.map(v => <option key={v.id} value={v.id}>{v.name} — {taka(v.price)}</option>)}
        </select>
      )}
      <p className="sf-detail-price">{taka(selected?.price ?? 0)}</p>
      <div className="sf-buy-actions">
        <button className="sf-btn sf-btn-outline" onClick={() => {
          add({ variantId: selected.id, name: productName, variantName: selected.name, price: selected.price, image })
          setAdded(true); setTimeout(() => setAdded(false), 1500)
        }}>{added ? "Added ✓" : "Add to cart"}</button>
        <button className="sf-btn" onClick={() => {
          add({ variantId: selected.id, name: productName, variantName: selected.name, price: selected.price, image })
          router.push(`/store/${slug}/checkout`)
        }}>Buy now</button>
      </div>
    </div>
  )
}
