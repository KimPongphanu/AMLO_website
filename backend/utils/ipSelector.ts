// utils/ipSelector.ts
import { Request } from 'express'

export interface ClientMetadata {
  ipAddress: string // Public IP (from x-forwarded-for header)
  serverIp: string // Private IP (what Express sees as req.ip)
  userAgent: string
}

export const getClientMetadata = (req: Request): ClientMetadata => {
  // ดักจับ IP จริงจาก Header หากระบบรันหลัง Nginx, Cloudflare, Vercel หรือ Render
  const forwardedFor = req.headers['x-forwarded-for']
  const forwardedList: string[] = Array.isArray(forwardedFor)
    ? forwardedFor
    : (forwardedFor?.split(',') || []).map((s) => s.trim())

  return {
    // Public IP: ตัวแรกใน x-forwarded-for (IP จริงของผู้ใช้)
    ipAddress: forwardedList[0] || req.ip || '0.0.0.0',
    // Private IP: req.ip (IP ที่ Express server เห็น, เช่น 172.x.x.x ใน Docker)
    serverIp: req.ip || '0.0.0.0',
    // User Agent
    userAgent: (req.headers['user-agent'] as string) || 'Unknown Device',
  }
}
