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

// The Pixel bootstrap function comes with extra properties bolted on (Meta's
// own snippet shape) — queue/callMethod/etc. aren't part of a plain function
// type, hence this dedicated interface instead of a bare function signature.
interface FbqFunction {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: IArguments[]
  push: FbqFunction
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: FbqFunction
    _fbq?: FbqFunction
  }
}

let sdkLoaded = false
const initializedPixels = new Set<string>()

function loadSDK(): Promise<void> {
  if (sdkLoaded) return Promise.resolve()

  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve()

    const inject = () => {
      if (
        sdkLoaded ||
        document.querySelector(`script[src="${PIXEL_CONFIG.sdkUrl}"]`)
      ) {
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
      document.head.appendChild(script)
    }

    // Load on user interaction (scroll, touch, mouse movement) to avoid
    // blocking the main thread during initial page load/Lighthouse checks.
    // Events are buffered in the queue via ensureFbq() and will flush automatically.
    let loaded = false
    const loadOnInteraction = () => {
      if (loaded) return
      loaded = true

      // Cleanup listeners
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, loadOnInteraction)
      })

      inject()
    }

    const interactionEvents = ["mousemove", "scroll", "keydown", "touchstart", "click"]

    // Add event listeners
    interactionEvents.forEach((event) => {
      window.addEventListener(event, loadOnInteraction, { passive: true, once: true })
    })

    // Fallback safety timeout (8 seconds) in case there is no user interaction
    setTimeout(loadOnInteraction, 8000)
  })
}

function ensureFbq(): void {
  if (typeof window === "undefined") return
  if (window.fbq) return

  // Meta's official Pixel bootstrap snippet, kept verbatim (including its
  // arguments/.apply() shape) — this is third-party vendor code, not ours to
  // restyle, and any behavior change here fails silently (broken ad tracking
  // with no test coverage to catch it).
  /* eslint-disable prefer-rest-params, prefer-spread */
  const n = (window.fbq = function () {
    if (n.callMethod) {
      n.callMethod.apply(n, arguments as unknown as unknown[])
    } else {
      n.queue.push(arguments)
    }
  } as FbqFunction)
  /* eslint-enable prefer-rest-params, prefer-spread */

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
