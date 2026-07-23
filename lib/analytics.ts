"use client";

// @ts-ignore
import googleAnalytics from "@analytics/google-analytics";
import Analytics from "analytics";

let analyticsInstance: ReturnType<typeof Analytics> | null = null;
let currentGaId: string | null = null;

export function initAnalytics(gaId: string) {
  if (typeof window === "undefined" || !gaId) return null;

  if (!analyticsInstance || currentGaId !== gaId) {
    currentGaId = gaId;
    analyticsInstance = Analytics({
      app: "sleep-sheet",
      plugins: [
        googleAnalytics({
          measurementIds: [gaId],
        }),
      ],
    });
  }

  return analyticsInstance;
}

export function trackPageView(url: string, gaId?: string) {
  if (typeof window === "undefined") return;
  
  if (gaId) {
    const instance = initAnalytics(gaId);
    if (instance) {
      instance.page({ path: url });
      return;
    }
  }

  if (analyticsInstance) {
    analyticsInstance.page({ path: url });
  }
}

export function trackEvent(eventName: string, payload?: Record<string, any>) {
  if (typeof window === "undefined" || !analyticsInstance) return;
  analyticsInstance.track(eventName, payload);
}

export function trackIdentify(userId: string, traits?: Record<string, any>) {
  if (typeof window === "undefined" || !analyticsInstance) return;
  analyticsInstance.identify(userId, traits);
}

export function getAnalyticsInstance() {
  return analyticsInstance;
}

export function getAnalyticsState() {
  if (typeof window === "undefined" || !analyticsInstance) return null;
  try {
    return analyticsInstance.getState();
  } catch {
    return null;
  }
}

export function getAnalyticsUser() {
  if (typeof window === "undefined" || !analyticsInstance) return null;
  try {
    return analyticsInstance.user();
  } catch {
    return null;
  }
}

export { analyticsInstance as analytics };
