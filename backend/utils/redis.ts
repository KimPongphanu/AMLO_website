// utils/redis.ts
/**
 * Redis Cache Client
 *
 * Usage:
 *   import redis from './utils/redis'
 *   await redis.setex('key', 300, JSON.stringify(data))
 *   const data = JSON.parse(await redis.get('key'))
 *
 * Falls back to in-memory cache if Redis is not configured.
 */

import cache from './cache'

interface RedisClient {
  get(key: string): Promise<string | null>
  setex(key: string, seconds: number, value: string): Promise<void>
  del(key: string): Promise<void>
}

let client: RedisClient

// Try to use ioredis if installed, fallback to in-memory cache
async function createClient(): Promise<RedisClient> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = await import('ioredis' as string)
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    const redis = new IORedis.default(redisUrl, {
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    })

    // Test connection
    await redis.ping()
    console.log('[Redis] Connected successfully')

    return {
      get: async (key: string) => redis.get(key),
      setex: async (key: string, seconds: number, value: string) => {
        await redis.setex(key, seconds, value)
      },
      del: async (key: string) => {
        await redis.del(key)
      },
    }
  } catch {
    console.warn('[Redis] Not available, falling back to in-memory cache')
    return {
      get: async (key: string) => {
        const val = cache.get<string>(key)
        return val || null
      },
      setex: async (key: string, seconds: number, value: string) => {
        cache.set(key, value, seconds)
      },
      del: async (key: string) => {
        cache.del(key)
      },
    }
  }
}

// Initialize lazily
let redisInstance: RedisClient | null = null

async function getRedis(): Promise<RedisClient> {
  if (!redisInstance) {
    redisInstance = await createClient()
  }
  return redisInstance
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = await getRedis()
  const val = await r.get(key)
  return val ? JSON.parse(val) : null
}

export async function cacheSet(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  const r = await getRedis()
  await r.setex(key, ttlSeconds, JSON.stringify(data))
}

export async function cacheDel(key: string): Promise<void> {
  const r = await getRedis()
  await r.del(key)
}

export default { cacheGet, cacheSet, cacheDel }
