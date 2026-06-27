import type { CacheEntry, FeedFormat } from "./types"
import { MetaCatalogConfig } from "./config"
import { computeEtag } from "./utils"

const store = new Map<string, CacheEntry>()

export function getCachedFeed(format: FeedFormat): CacheEntry | null {
  const key = `feed:${format}`
  const entry = store.get(key)
  if (!entry) return null

  const age = Date.now() - entry.generatedAt
  if (age > MetaCatalogConfig.cacheDuration * 1000) {
    store.delete(key)
    return null
  }

  return entry
}

export function setCachedFeed(format: FeedFormat, data: string): CacheEntry {
  const key = `feed:${format}`
  const entry: CacheEntry = {
    data,
    format,
    generatedAt: Date.now(),
    etag: computeEtag(data),
  }
  store.set(key, entry)
  return entry
}

export function invalidateFeed(): void {
  store.clear()
}

export function getCacheAge(format: FeedFormat): number | null {
  const entry = store.get(`feed:${format}`)
  if (!entry) return null
  return Date.now() - entry.generatedAt
}
