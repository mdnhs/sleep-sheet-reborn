import { PIXEL_CONFIG } from "./config"
import { isValidPixelId } from "./pixel-mapping"
import { getAttribution } from "./storage"
import type {
  MetaEventName,
  EventParams,
  TrackEventOptions,
  AnyEventParams,
} from "./events"
import { generateEventId, debugLog } from "./utils"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: (...args: unknown[]) => void
  }
}

let sdkLoaded = false
let initializedPixels = new Set<string>()

function loadSDK(): Promise<void> {
  if (sdkLoaded) return Promise.resolve()

  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve()

    if (document.querySelector(`script[src="${PIXEL_CONFIG.sdkUrl}"]`)) {
      sdkLoaded = true
      return resolve()
    }

    const script = document.createElement("script")
    script.async = true
    script.defer = true
    script.src = PIXEL_CONFIG.sdkUrl
    script.onload = () => {
      sdkLoaded = true
      resolve()
    }

    const firstScript = document.getElementsByTagName("script")[0]
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript)
    } else {
      document.head.appendChild(script)
    }
  })
}

function ensureFbq(): void {
  if (typeof window === "undefined") return
  if (window.fbq) return

  const n = (window.fbq = function () {
    if (n.callMethod) {
      n.callMethod.apply(n, arguments as unknown as unknown[])
    } else {
      n.queue.push(arguments)
    }
  } as any)

  if (!window._fbq) window._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
}

export async function initPixel(pixelId: string): Promise<void> {
  if (typeof window === "undefined") return
  if (!isValidPixelId(pixelId)) {
    debugLog("error", { message: "Cannot init invalid Pixel ID", pixelId })
    return
  }
  if (initializedPixels.has(pixelId)) return

  ensureFbq()

  window.fbq?.("init", pixelId)
  initializedPixels.add(pixelId)

  debugLog("init", { pixelId })
  
  await loadSDK()
}

export function track<E extends MetaEventName>(
  eventName: E,
  params: EventParams[E] | AnyEventParams = {},
  options?: TrackEventOptions,
): void {
  if (typeof window === "undefined") return
  if (!window.fbq) {
    debugLog("error", { message: "fbq not initialized", eventName })
    return
  }

  const activePixelId = getActivePixelId()
  if (!activePixelId) {
    debugLog("error", { message: "No active Pixel ID for tracking", eventName })
    return
  }

  const eventPayload: Record<string, unknown> = { ...params } as Record<string, unknown>

  // The dedup key MUST be passed as the 4th argument to fbq (the event
  // options object) — NOT inside the custom-data payload. Meta only reads
  // `eventID` from this options object when matching against a Conversions
  // API event of the same name. Putting it in the payload (as we did before)
  // means the browser sends no dedup key at all, so every event is counted
  // twice. See: developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
  const eventId = options?.disableDeduplication
    ? undefined
    : options?.eventId ?? generateEventId()

  if (eventId) {
    window.fbq("trackSingle", activePixelId, eventName, eventPayload, { eventID: eventId })
  } else {
    window.fbq("trackSingle", activePixelId, eventName, eventPayload)
  }

  debugLog("event", {
    event: eventName,
    pixelId: activePixelId,
    eventId,
    payload: eventPayload,
  })
}

export function getActivePixelId(): string | null {
  const attr = getAttribution()

  if (attr?.pixelId && isValidPixelId(attr.pixelId)) {
    return attr.pixelId
  }

  return PIXEL_CONFIG.defaultPixelId || null
}

export function resetPixels(): void {
  initializedPixels.clear()
}
