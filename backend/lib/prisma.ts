// lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

// ── Connection Pool Configuration ──
// Tuned for production workloads. All values are configurable via environment variables.
// For high-traffic deployments, increase DB_POOL_MAX based on your PostgreSQL max_connections.
//
// Read Replica support (for future scaling):
// To add a read replica, create a second pool with DATABASE_READ_URL:
//   const readPool = new Pool({ connectionString: process.env.DATABASE_READ_URL || connectionString, ... })
// Then use PrismaClient with the replica adapter pattern.
const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Increased from 10 for better concurrency
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'), // 30s
  connectionTimeoutMillis: parseInt(
    process.env.DB_POOL_CONNECT_TIMEOUT || '5000',
  ), // 5s
  maxUses: parseInt(process.env.DB_POOL_MAX_USES || '7500'), // Recycle connection after uses
})
const adapter = new PrismaPg(pool)

// Conditional logging: full queries in dev, only warnings/errors in production
const isProduction = process.env.NODE_ENV === 'production'
const prisma = new PrismaClient({
  adapter,
  log: isProduction ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'],
})

export default prisma
