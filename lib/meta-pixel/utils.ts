import { PIXEL_CONFIG } from "./config"
import { getAllMappings, isValidPixelId, resolvePixelId } from "./pixel-mapping"
import type { AttributionData, DebugPayload } from "./events"

export function parseAttributionFromUrl(): AttributionData | null {
  if (typeof window === "undefined") return null

  const params = new URLSearchParams(window.location.search)
  const { attributionParams } = PIXEL_CONFIG

  const pixelParam = params.get(attributionParams.pixel)
  const pageParam = params.get(attributionParams.page)
  const campaignParam = params.get(attributionParams.campaign)
  const sourceParam = params.get(attributionParams.source)
  const mediumParam = params.get(attributionParams.medium)
  const termParam = params.get(attributionParams.term)
  const contentParam = params.get(attributionParams.content)

  const pixelId = resolvePixelId(pixelParam, pageParam)
  if (!pixelId) return null

  const pageName =
    pageParam ||
    Object.entries(getAllMappings()).find(([, id]) => id === pixelId)?.[0] ||
    ""

  return {
    pixelId,
    pageName,
    campaign: campaignParam || undefined,
    timestamp: Date.now(),
    utm: {
      source: sourceParam || undefined,
      medium: mediumParam || undefined,
      campaign: campaignParam || undefined,
      term: termParam || undefined,
      content: contentParam || undefined,
    },
  }
}

export function generateEventId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}_${random}`
}

export function debugLog(type: DebugPayload["type"], data: DebugPayload["data"]): void {
  if (typeof window === "undefined") return
  if (!PIXEL_CONFIG.debug) return

  const styles: Record<string, string> = {
    attribution: "color: #6366f1; font-weight: bold;",
    event: "color: #22c55e; font-weight: bold;",
    init: "color: #f59e0b; font-weight: bold;",
    error: "color: #ef4444; font-weight: bold;",
    storage: "color: #3b82f6; font-weight: bold;",
  }

  const label = `[MetaPixel:${type}]`
  const style = styles[type] || "font-weight: bold;"

  if (type === "error") {
    console.error(`${label}`, data)
  } else {
    console.log(`${label}`, data)
  }
}

export function validateAttribution(data: AttributionData): boolean {
  if (!data.pixelId || typeof data.pixelId !== "string") return false
  if (!isValidPixelId(data.pixelId)) {
    debugLog("error", { message: "Invalid Pixel ID format", pixelId: data.pixelId })
    return false
  }
  if (!data.pageName || typeof data.pageName !== "string") return false
  if (!data.timestamp || typeof data.timestamp !== "number") return false
  return true
}
