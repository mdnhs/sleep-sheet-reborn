"use client"

import { createContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { saveAttribution, getAttribution } from "./storage"
import { parseAttributionFromUrl, debugLog } from "./utils"
import { initPixel, track, getActivePixelId } from "./tracker"
import { PIXEL_CONFIG, applyPixelOverrides } from "./config"
import { setRuntimeMappings } from "./pixel-mapping"
import type {
  MetaEventName,
  EventParams,
  TrackEventOptions,
  AttributionData,
  AnyEventParams,
} from "./events"

interface PixelContextValue {
  track: <E extends MetaEventName>(
    eventName: E,
    params: EventParams[E] | AnyEventParams,
    options?: TrackEventOptions,
  ) => void
  attribution: AttributionData | null
  pixelId: string | null
  isReady: boolean
  enabled: boolean
}

export const PixelContext = createContext<PixelContextValue | null>(null)

interface PixelProviderProps {
  children: ReactNode
  enabled?: boolean
  defaultPixelId?: string
  debug?: boolean
  pageMappings?: Record<string, string>
}

export function PixelProvider({
  children,
  enabled = true,
  defaultPixelId,
  debug,
  pageMappings,
}: PixelProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [pixelId, setPixelId] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<AttributionData | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!enabled) {
      debugLog("init", { message: "Pixel tracking disabled by admin settings" })
      setIsReady(true)
      return
    }

    if (initialized.current) return
    initialized.current = true

    const overrides: Partial<typeof PIXEL_CONFIG> = {}
    if (defaultPixelId !== undefined) overrides.defaultPixelId = defaultPixelId
    if (debug !== undefined) overrides.debug = debug
    applyPixelOverrides(overrides)

    if (pageMappings) {
      setRuntimeMappings(pageMappings)
    }

    async function initialize() {
      const urlAttribution = parseAttributionFromUrl()

      if (urlAttribution) {
        saveAttribution(urlAttribution)
        setAttribution(urlAttribution)
        debugLog("attribution", {
          source: "url",
          data: urlAttribution,
        })
      }

      const storedAttr = urlAttribution || getAttribution()
      const activePixelId = getActivePixelId()

      if (storedAttr) {
        setAttribution(storedAttr)
      }

      if (activePixelId) {
        setPixelId(activePixelId)
        await initPixel(activePixelId)
        // Note: PageView is fired by the pathname-aware effect below,
        // not here, so it re-fires correctly on every client-side
        // route change (SPA navigation) instead of just once per session.
      }

      setIsReady(true)
    }

    initialize()
  }, [enabled, defaultPixelId, debug])

  // Fire PageView on initial load AND on every subsequent client-side
  // route change. Without this, Next.js client-side navigation (Link,
  // router.push) never re-fires PageView, so Meta always attributes
  // visitors to the entry URL (e.g. homepage) even after they've
  // navigated deep into the site (e.g. /shop/[productId]). This breaks
  // URL-based Custom Audiences and per-page conversion attribution.
  const pathname = usePathname()
  const lastFiredPathname = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !isReady) return
    // Guards against firing the same PageView twice for one pathname —
    // React StrictMode (dev) double-invokes this effect on mount, and
    // without this guard Meta reports "PageView fired 2 times with
    // identical data" for every page load.
    if (lastFiredPathname.current === pathname) return
    lastFiredPathname.current = pathname
    track("PageView")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, enabled, isReady])

  const contextValue: PixelContextValue = {
    track: <E extends MetaEventName>(
      eventName: E,
      params: EventParams[E] | AnyEventParams,
      options?: TrackEventOptions,
    ) => {
      if (!enabled) return

      const currentPixelId = getActivePixelId()
      if (currentPixelId !== pixelId) {
        setPixelId(currentPixelId)
      }

      track(eventName, params, options)
    },
    attribution,
    pixelId,
    isReady,
    enabled,
  }

  return (
    <PixelContext.Provider value={contextValue}>
      {children}
    </PixelContext.Provider>
  )
}
