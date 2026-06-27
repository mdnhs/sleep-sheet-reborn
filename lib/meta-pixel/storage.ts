import { PIXEL_CONFIG } from "./config"
import type { AttributionData } from "./events"
import { validateAttribution, debugLog } from "./utils"

function setCookie(value: string, days: number): void {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${PIXEL_CONFIG.cookieName}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${PIXEL_CONFIG.cookieName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setLocalStorage(value: string): void {
  try {
    localStorage.setItem(PIXEL_CONFIG.cookieName, value)
  } catch {
    debugLog("error", { message: "localStorage write failed" })
  }
}

function getLocalStorage(): string | null {
  try {
    return localStorage.getItem(PIXEL_CONFIG.cookieName)
  } catch {
    return null
  }
}

function removeLocalStorage(): void {
  try {
    localStorage.removeItem(PIXEL_CONFIG.cookieName)
  } catch {
    /**/
  }
}

function removeCookie(): void {
  if (typeof document === "undefined") return
  document.cookie = `${PIXEL_CONFIG.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export function saveAttribution(data: AttributionData): void {
  if (!validateAttribution(data)) {
    debugLog("error", { message: "Invalid attribution data, not saving", data })
    return
  }

  const serialized = JSON.stringify(data)

  setCookie(serialized, PIXEL_CONFIG.cookieExpirationDays)
  setLocalStorage(serialized)

  debugLog("storage", { action: "saved", data })
}

export function getAttribution(): AttributionData | null {
  let raw = getCookie()

  if (!raw) {
    raw = getLocalStorage()
    if (raw) {
      setCookie(raw, PIXEL_CONFIG.cookieExpirationDays)
    }
  }

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AttributionData
    return validateAttribution(parsed) ? parsed : null
  } catch {
    debugLog("error", { message: "Failed to parse stored attribution" })
    return null
  }
}

export function clearAttribution(): void {
  removeCookie()
  removeLocalStorage()
  debugLog("storage", { action: "cleared" })
}
