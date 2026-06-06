"use client"
import { useCallback, useEffect, useState } from "react"

export type CartItem = { variantId: string; name: string; variantName: string; price: number; qty: number; image: string | null }

const key = (slug: string) => `sf-cart-${slug}`

function read(slug: string): CartItem[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(key(slug)) ?? "[]") as CartItem[] } catch { return [] }
}
function write(slug: string, items: CartItem[]) {
  localStorage.setItem(key(slug), JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("sf-cart", { detail: slug }))
}

/** Minimal localStorage cart scoped per storefront tenant. */
export function useCart(slug: string) {
  const [items, setItems] = useState<CartItem[]>([])
  useEffect(() => {
    setItems(read(slug))
    const onChange = (e: Event) => { if ((e as CustomEvent).detail === slug) setItems(read(slug)) }
    window.addEventListener("sf-cart", onChange)
    return () => window.removeEventListener("sf-cart", onChange)
  }, [slug])

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    const cur = read(slug)
    const found = cur.find(i => i.variantId === item.variantId)
    if (found) found.qty += qty
    else cur.push({ ...item, qty })
    write(slug, cur)
  }, [slug])

  const setQty = useCallback((variantId: string, qty: number) => {
    const cur = read(slug).map(i => i.variantId === variantId ? { ...i, qty } : i).filter(i => i.qty > 0)
    write(slug, cur)
  }, [slug])

  const clear = useCallback(() => write(slug, []), [slug])

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)
  return { items, add, setQty, clear, total, count }
}
