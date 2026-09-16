"use client";

import { useEffect } from "react";
import { captureFbclid } from "@/lib/meta-fbc";

/**
 * Captures Meta's click-id on landing.
 *
 * All Meta Pixel events are fired by the GTM web container, not by this app —
 * see the Meta Pixel tags in GTM-PQ667JWQ. What GTM cannot do from the
 * browser is reliably recover `fbclid` from the landing URL when the Pixel's
 * own `_fbc` cookie has not been set yet, which is what left the click-id
 * missing on Purchase events.
 *
 * So this is all that remains of the app's own Meta integration: one effect
 * that writes the `_fbc` cookie. The Stape CAPI tag in the server container
 * reads that cookie, and lib/gtm passes the same value into the dataLayer for
 * the browser tag's Advanced Matching, so both sides get the click-id.
 */
export function FbcCapture() {
  useEffect(() => {
    captureFbclid();
  }, []);

  return null;
}
