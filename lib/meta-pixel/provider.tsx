"use client"

import { createContext, useEffect, useRef, useState, type ReactNode } from "react"
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
        track("PageView")
      }

      setIsReady(true)
    }

    initialize()
  }, [enabled, defaultPixelId, debug])

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
