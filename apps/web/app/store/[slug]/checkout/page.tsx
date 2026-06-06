"use client"
import { use, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCart } from "@/features/(storefront)/components/storefront-cart"

const taka = (n: number) => `৳${n.toLocaleString()}`
const METHODS = ["COD", "bKash", "Nagad", "SSLCommerz"] as const
type Method = typeof METHODS[number]
const ORDER_METHOD: Record<Method, string> = { COD: "COD", bKash: "BKASH", Nagad: "NAGAD", SSLCommerz: "SSLCOMMERZ" }

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const funnelId = useSearchParams().get("funnel") ?? undefined
  const { items, setQty, clear, total } = useCart(slug)
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", area: "", city: "" })
  const [method, setMethod] = useState<Method>("COD")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ orderNumber: string; grandTotal: number } | null>(null)
  const [error, setError] = useState("")
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function placeOrder() {
    setBusy(true); setError("")
    try {
      const res = await fetch("/api/public/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ variantId: i.variantId, quantity: i.qty })),
          customer: { name: form.name, phone: form.phone, email: form.email || undefined, address: form.address, area: form.area || undefined, city: form.city },
          paymentMethod: ORDER_METHOD[method],
          funnelId,
        }),
      })
      const body = await res.json() as { success: boolean; data?: { orderId: string; orderNumber: string; grandTotal: number }; error?: { message: string } }
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Order failed")
      const order = body.data!
      clear()
      if (method === "COD") { setDone(order); return }
      // Online: initiate payment, then go to the (mock) gateway page
      const initRes = await fetch("/api/public/payments/initiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, provider: method }),
      })
      const init = await initRes.json() as { success: boolean; data?: { paymentId: string; gateway?: boolean; checkoutUrl?: string | null }; error?: { message: string } }
      if (!initRes.ok || !init.success) throw new Error(init.error?.message ?? "Payment init failed")
      // Configured provider → hosted gateway page; otherwise the sandbox mock page.
      if (init.data!.gateway && init.data!.checkoutUrl) { window.location.href = init.data!.checkoutUrl; return }
      const q = new URLSearchParams({ provider: method, amount: String(order.grandTotal), order: order.orderNumber })
      router.push(`/store/${slug}/pay/${init.data!.paymentId}?${q.toString()}`)
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  if (done) {
    return (
      <div className="sf-checkout">
        <h1 className="sf-detail-title">Thank you! 🎉</h1>
        <p className="sf-detail-desc">Order <strong>{done.orderNumber}</strong> placed. Total {taka(done.grandTotal)} (Cash on Delivery).</p>
        <p style={{ marginTop: "1.5rem" }}><a className="sf-btn" href={`/store/${slug}`}>Continue shopping</a></p>
      </div>
    )
  }

  if (!items.length) {
    return <div className="sf-checkout"><h1 className="sf-detail-title">Your cart is empty</h1><p style={{ marginTop: "1rem" }}><a className="sf-btn" href={`/store/${slug}`}>Browse products</a></p></div>
  }

  const valid = form.name && form.phone && form.address && form.city

  return (
    <div className="sf-checkout">
      <h1 className="sf-detail-title">Checkout</h1>

      <h2 className="sf-section-title" style={{ marginTop: "1.5rem" }}>Your cart</h2>
      {items.map(i => (
        <div key={i.variantId} className="sf-row">
          <span>{i.name} <span className="sf-muted">({i.variantName})</span></span>
          <span>
            <input className="sf-input" style={{ width: 60, display: "inline-block", marginRight: 12 }} type="number" min={1} value={i.qty} onChange={e => setQty(i.variantId, Number(e.target.value))} />
            {taka(i.price * i.qty)}
          </span>
        </div>
      ))}
      <div className="sf-total"><span>Total</span><span>{taka(total)}</span></div>

      <h2 className="sf-section-title">Delivery details</h2>
      <input className="sf-input" placeholder="Full name *" value={form.name} onChange={e => set("name", e.target.value)} />
      <input className="sf-input" placeholder="Phone *" value={form.phone} onChange={e => set("phone", e.target.value)} />
      <input className="sf-input" placeholder="Email (optional)" value={form.email} onChange={e => set("email", e.target.value)} />
      <input className="sf-input" placeholder="Address *" value={form.address} onChange={e => set("address", e.target.value)} />
      <input className="sf-input" placeholder="Area" value={form.area} onChange={e => set("area", e.target.value)} />
      <input className="sf-input" placeholder="City *" value={form.city} onChange={e => set("city", e.target.value)} />

      <h2 className="sf-section-title">Payment</h2>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {METHODS.map(m => (
          <button key={m} type="button" onClick={() => setMethod(m)}
            className={`sf-btn ${method === m ? "" : "sf-btn-outline"}`}>
            {m === "COD" ? "Cash on Delivery" : m}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      <button className="sf-btn" disabled={busy || !valid} onClick={placeOrder}>
        {busy ? "Processing…" : method === "COD" ? `Place order — ${taka(total)} (COD)` : `Pay ${taka(total)} with ${method}`}
      </button>
    </div>
  )
}
