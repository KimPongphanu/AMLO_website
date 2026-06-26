// utils/cache.ts
/**
 * Simple in-memory cache with TTL support.
 * Used for caching GeoIP lookups and frequently accessed data
 * to reduce external API calls and database queries.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private hitCount = 0
  private missCount = 0

  /**
   * Get a value from cache. Returns `undefined` if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) {
      this.missCount++
      return undefined
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.missCount++
      return undefined
    }
    this.hitCount++
    return entry.data as T
  }

  /**
   * Set a value in cache with TTL in seconds.
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  /**
   * Delete a specific key from cache.
   */
  del(key: string): void {
    this.store.delete(key)
  }

  /**
   * Clear all entries from cache.
   */
  flushAll(): void {
    this.store.clear()
  }

  /**
   * Clean up expired entries.
   */
  prune(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Get cache statistics.
   */
  stats(): { size: number; hits: number; misses: number; hitRate: string } {
    const total = this.hitCount + this.missCount
    return {
      size: this.store.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate:
        total > 0 ? `${((this.hitCount / total) * 100).toFixed(1)}%` : '0%',
    }
  }
}

// Singleton instance
const cache = new MemoryCache()

// Auto-prune expired entries every 5 minutes
setInterval(() => cache.prune(), 5 * 60 * 1000)

export default cache
