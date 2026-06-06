"use client"
import { use, useState } from "react"

const taka = (n: number | string) => `৳${Number(n).toLocaleString()}`
const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`)

/**
 * Mock payment gateway. Real bKash/Nagad/SSLCommerz hosted checkout replaces this page;
 * the success/fail buttons stand in for the provider's server-to-server webhook.
 */
export default function PayPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string; paymentId: string }>
  searchParams: Promise<{ provider?: string; amount?: string; order?: string }>
}) {
  const { slug, paymentId } = use(params)
  const sp = use(searchParams)
  const provider = sp.provider ?? "bKash"
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<"PAID" | "FAILED" | null>(null)
  const [error, setError] = useState("")

  async function simulate(status: "success" | "failed") {
    setBusy(true); setError("")
    try {
      const res = await fetch(`/api/public/payments/${provider}/webhook`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, providerRef: `MOCK-${uuid().slice(0, 8)}`, status, idempotencyKey: uuid() }),
      })
      const body = await res.json() as { success: boolean; data?: { status?: string }; error?: { message: string } }
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Payment failed")
      setResult(status === "success" ? "PAID" : "FAILED")
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  if (result) {
    return (
      <div className="sf-checkout" style={{ textAlign: "center" }}>
        <h1 className="sf-detail-title">{result === "PAID" ? "Payment successful 🎉" : "Payment failed"}</h1>
        {result === "PAID"
          ? <p className="sf-detail-desc">Order {sp.order} is confirmed and paid.</p>
          : <p className="sf-detail-desc">Your order {sp.order} was placed but payment did not complete. You can retry from your orders.</p>}
        <p style={{ marginTop: "1.5rem" }}><a className="sf-btn" href={`/store/${slug}`}>Back to store</a></p>
      </div>
    )
  }

  return (
    <div className="sf-checkout" style={{ textAlign: "center" }}>
      <h1 className="sf-detail-title">{provider} Checkout</h1>
      <p className="sf-detail-price">{taka(sp.amount ?? 0)}</p>
      <p className="sf-muted">Order {sp.order} · sandbox gateway</p>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      <div className="sf-buy-actions" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
        <button className="sf-btn" disabled={busy} onClick={() => simulate("success")}>{busy ? "Processing…" : "Pay now"}</button>
        <button className="sf-btn sf-btn-outline" disabled={busy} onClick={() => simulate("failed")}>Cancel / fail</button>
      </div>
    </div>
  )
}
