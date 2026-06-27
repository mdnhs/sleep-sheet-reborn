"use client"

import { useCallback, useContext } from "react"
import { PixelContext } from "./provider"
import type { MetaEventName, EventParams, TrackEventOptions, AnyEventParams } from "./events"

export function usePixelTracking() {
  const ctx = useContext(PixelContext)

  const trackEvent = useCallback(
    <E extends MetaEventName>(
      eventName: E,
      params?: EventParams[E] | AnyEventParams,
      options?: TrackEventOptions,
    ) => {
      ctx?.track(eventName, params ?? {}, options)
    },
    [ctx],
  )

  return {
    track: trackEvent as <E extends MetaEventName>(
      eventName: E,
      params?: EventParams[E] | AnyEventParams,
      options?: TrackEventOptions,
    ) => void,
    attribution: ctx?.attribution ?? null,
    pixelId: ctx?.pixelId ?? null,
    isReady: ctx?.isReady ?? false,
  }
}

export function useAttribution() {
  const ctx = useContext(PixelContext)
  return {
    attribution: ctx?.attribution ?? null,
    pixelId: ctx?.pixelId ?? null,
  }
}

export function usePixelReady() {
  const ctx = useContext(PixelContext)
  return ctx?.isReady ?? false
}
