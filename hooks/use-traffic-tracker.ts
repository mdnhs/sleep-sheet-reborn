"use client";

import { useCallback } from "react";
import {
  trackEvent,
  type TrafficEventType,
} from "@/lib/traffic-tracker";

export function useTrafficTracker() {
  const track = useCallback(
    (
      type: TrafficEventType,
      path: string,
      label?: string,
      meta?: Record<string, string | number | boolean>
    ) => {
      trackEvent(type, path, label, meta);
    },
    []
  );

  return { track };
}
