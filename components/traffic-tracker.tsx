"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/traffic-tracker";

export function TrafficTracker() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      trackEvent("page_view", pathname);
    }
  }, [pathname]);

  useEffect(() => {
    trackEvent("page_view", pathname);
  }, []);

  return null;
}
