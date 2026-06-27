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

    if (window.fbq) {
      sdkLoaded = true
      resolve()
      return
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
    }
  })
}

function ensureFbq(): void {
  if (typeof window === "undefined") return
  if (window.fbq) return

  window.fbq = function () {
    const f = window.fbq as unknown as {
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[]
    }
    if (f.callMethod) {
      f.callMethod.apply(f, arguments as unknown as unknown[])
    } else if (f.queue) {
      f.queue.push(Array.from(arguments))
    }
  } as unknown as (...args: unknown[]) => void

  const f = window.fbq as unknown as {
    queue?: unknown[]
    loaded?: boolean
    version?: string
  }

  if (!f.queue) {
    f.queue = []
  }

  window._fbq = window.fbq
}

export async function initPixel(pixelId: string): Promise<void> {
  if (typeof window === "undefined") return
  if (!isValidPixelId(pixelId)) {
    debugLog("error", { message: "Cannot init invalid Pixel ID", pixelId })
    return
  }
  if (initializedPixels.has(pixelId)) return

  await loadSDK()
  ensureFbq()

  window.fbq?.("init", pixelId)
  initializedPixels.add(pixelId)

  debugLog("init", { pixelId })
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

  if (!options?.disableDeduplication) {
    eventPayload.eventID = generateEventId()
  }

  window.fbq("trackSingle", activePixelId, eventName, eventPayload)

  debugLog("event", {
    event: eventName,
    pixelId: activePixelId,
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
