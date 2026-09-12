// Captures Meta's click-id (`fbclid`) on first landing and turns it into the
// `fbc` format the Conversions API expects, independent of whether the
// Pixel's own `_fbc` first-party cookie gets set in time — GTM load order,
// Safari ITP, and ad blockers can all prevent that cookie from existing by
// the time checkout happens, which is what left `fbc` at 0% coverage on the
// server-side Purchase event. This is a small, self-contained capture: it
// does not touch how/when the Pixel itself loads.
const STORAGE_KEY = "_fbc_captured";
const COOKIE_NAME = "_fbc";
const COOKIE_DAYS = 90; // matches Meta's own _fbc cookie lifetime

function setCookie(value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Reads `fbclid` off the current URL and, if present, builds the `fbc`
 * value in Meta's documented format (`fb.1.<creation_time_ms>.<fbclid>`),
 * then persists it to both a cookie and localStorage. A no-op if there's no
 * `fbclid`, or if a real `_fbc` cookie (set by the Pixel itself) already
 * exists — that one is authoritative. Call once per page load, client-side.
 */
export function captureFbclid(): void {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (!fbclid) return;
    if (getCookie(COOKIE_NAME)) return;
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    setCookie(fbc, COOKIE_DAYS);
    localStorage.setItem(STORAGE_KEY, fbc);
  } catch {
    /* best-effort only — never block the page on this */
  }
}

/**
 * The `fbc` value to submit with a conversion: the live cookie (the Pixel's
 * own `_fbc`, or ours from captureFbclid) if present, else the localStorage
 * fallback for browsers/contexts where the cookie didn't stick.
 */
export function getCapturedFbc(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return getCookie(COOKIE_NAME) || localStorage.getItem(STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}
