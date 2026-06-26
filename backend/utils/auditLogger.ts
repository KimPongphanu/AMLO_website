// utils/auditLogger.ts
import { Request } from 'express'
import prisma from '../lib/prisma'
import cache from './cache'
import { getClientMetadata } from './ipSelector'

const GEO_API_URL = 'http://ip-api.com/json'
const GEO_CACHE_TTL = 86400 // 24 hours in seconds

const lookupGeoRegion = async (ip: string): Promise<string | null> => {
  // ถ้าเป็น private/local IP ไม่ต้อง query Geo
  if (
    !ip ||
    ip === '0.0.0.0' ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return null
  }

  // Check centralized cache
  const cached = cache.get<string>(`geo:${ip}`)
  if (cached) return cached

  try {
    const res = await fetch(
      `${GEO_API_URL}/${ip}?fields=country,regionName,city`,
      { signal: AbortSignal.timeout(3000) },
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      country: string
      regionName: string
      city: string
    }
    if (data.country) {
      const region = `${data.country}, ${data.regionName}, ${data.city}`
      cache.set(`geo:${ip}`, region, GEO_CACHE_TTL)
      return region
    }
  } catch {
    // fail silently — ไม่ blocking
  }
  return null
}

export const logAudit = async (
  req: Request,
  action: string,
  details: string,
  userId?: number | null,
) => {
  const { ipAddress, serverIp, userAgent } = getClientMetadata(req)

  try {
    // 🔴 FIX: Create audit log immediately WITHOUT awaiting geo lookup
    // The geo lookup runs as fire-and-forget to prevent N+1 HTTP delay
    await prisma.auditLog.create({
      data: { userId, action, ipAddress, serverIp, userAgent, details },
    })

    // Fire-and-forget geo lookup: update region in background
    // This prevents slow geo API calls from blocking the main request
    lookupGeoRegion(ipAddress)
      .then((region) => {
        if (region) {
          // Update the just-created audit log with region info
          prisma.auditLog
            .updateMany({
              where: {
                ipAddress,
                createdAt: { gte: new Date(Date.now() - 2000) },
              },
              data: { region },
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  } catch (err) {
    console.error(`Audit Log Failed [${action}]:`, err)
  }
}
