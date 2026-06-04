"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReceiveProductsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/purchases/purchase-orders")
  }, [router])
  return null
}
