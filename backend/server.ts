// server.ts
import * as Sentry from '@sentry/node'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { Express, Request, Response } from 'express'
import helmet from 'helmet'
import cron from 'node-cron'
import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import prisma from './lib/prisma'
import { validateCsrf } from './middlewares/csrf'
import { globalErrorHandler } from './middlewares/errorHandler'
import { apiLimiter } from './middlewares/rateLimiter'
import { validateAndUpdateSession } from './middlewares/session'
import { setCharset } from './middlewares/setCharset'
import logger from './utils/logger'

// ── Sentry Error Tracking ──
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.2,
  enabled: !!process.env.SENTRY_DSN,
})

// ── Route Imports ──
import adminRoutes from './routes/adminRoute'
import auditRoutes from './routes/auditRoute'
import authRoutes from './routes/authRoute'
import backupRoutes from './routes/backupRoute'
import bannerRoutes from './routes/bannerRoute'
import commentRoutes from './routes/commentRoute'
import contactRoutes from './routes/contactRoute'
import departmentRoutes from './routes/departmentRoute'
import fileRoutes from './routes/fileRoute'
import footerSettingRoutes from './routes/footerSettingRoute'
import newsRoutes from './routes/newsRoute'
import sliderRoutes from './routes/sliderRoute'
import splashPopupRoutes from './routes/splashPopupRoute'
import supervisorRequestRoutes from './routes/supervisorRequestRoute'
import twoFactorRoutes from './routes/twoFactorRoute'
import uploadRoutes from './routes/uploadRoute'

const app: Express = express()
const port: number = 8080

// ── Swagger/OpenAPI Configuration ──
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AMLO Website API',
      version: '1.0.0',
      description: 'API for AMLO (Anti-Money Laundering Office) Website Management System',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
  },
  apis: ['./routes/*.ts', './controllers/*.ts'],
})

// ── Security Middleware ──
// Custom Helmet configuration tailored for AMLO requirements
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HTTP Strict Transport Security (HSTS) — 1 year
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options: DENY — prevent clickjacking
    frameguard: { action: 'deny' },
    // Referrer-Policy
    referrerPolicy: { policy: 'same-origin' },
    // Permissions-Policy via helmet's crossOriginEmbedderPolicy
    crossOriginEmbedderPolicy: false,
  }),
)
app.set('trust proxy', 1)
app.use(validateCsrf) // CSRF protection for all routes
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(setCharset)
app.use(validateAndUpdateSession)

// ── CORS ──
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://10.89.163.40:5173',
        'http://localhost',
        'http://127.0.0.1',
      ]
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
  }),
)

// ── Static Files & Rate Limiter ──
import fs from 'fs'
const UPLOADS_DIR = fs.existsSync('/app/uploads') ? '/app/uploads' : path.join(__dirname, 'uploads')
app.use('/uploads', express.static(UPLOADS_DIR))
logger.info(`[Uploads] Serving from: ${UPLOADS_DIR}`)
app.use('/api', apiLimiter)

// ── Swagger UI ──
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AMLO API Docs',
  }),
)

// ── Health Check ──
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    })
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    })
  }
})

// ── API v1 Routes ──
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/news', newsRoutes)
app.use('/api/v1/departments', departmentRoutes)
app.use('/api/v1/files', fileRoutes)
app.use('/api/v1/contact', contactRoutes)
app.use('/api/v1/comments', commentRoutes)
app.use('/api/v1/audit', auditRoutes)
app.use('/api/v1/banners', bannerRoutes)
app.use('/api/v1/settings', footerSettingRoutes)
app.use('/api/v1/slider', sliderRoutes)
app.use('/api/v1/splash-popups', splashPopupRoutes)
app.use('/api/v1/2fa', twoFactorRoutes)
app.use('/api/v1/supervisor-request', supervisorRequestRoutes)
app.use('/api/v1/backups', backupRoutes)

// ── Legacy API Routes (backward compatibility) ──
app.use('/api/admin', adminRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/settings', footerSettingRoutes)
app.use('/api/slider', sliderRoutes)
app.use('/api/splash-popups', splashPopupRoutes)
app.use('/api/2fa', twoFactorRoutes)
app.use('/api/supervisor-request', supervisorRequestRoutes)
app.use('/api/backups', backupRoutes)

app.get('/', (req: Request, res: Response) => {
  res.send('Server is running with TypeScript!')
})

// ── Swagger JSON endpoint ──
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.use(globalErrorHandler)

// ── Auto Backup — 03:00 daily ──
import { spawn } from 'child_process'
cron.schedule('0 3 * * *', () => {
  const pgDump = 'pg_dump'
  const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `backup_${date}.sql`
  const backupDir = '/app/backups'
  // Use async mkdir to avoid blocking the event loop
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true })
    } catch {
      /* ignore */
    }
  }
  const outputFile = path.join(backupDir, filename)

  const url = new URL(process.env.DATABASE_URL!)
  const args = [
    '--host',
    url.hostname,
    '--port',
    url.port || '5432',
    '--username',
    decodeURIComponent(url.username),
    '--dbname',
    url.pathname.slice(1),
    '--file',
    outputFile,
    '--format',
    'plain',
    '--no-owner',
  ]

  const child = spawn(pgDump, args, {
    env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
    timeout: 5 * 60 * 1000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stderr = ''
  child.stderr?.on('data', (data: Buffer) => {
    stderr += data.toString()
  })

  child.on('close', (code: number | null) => {
    if (code !== 0) {
      logger.error(`[Auto Backup] Failed (exit code ${code}): ${stderr.trim()}`)
      return
    }
    const size = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(1)
    logger.info(`[Auto Backup] Created: ${filename} (${size} MB)`)
  })

  child.on('error', (err: Error) => {
    logger.error('[Auto Backup] Error:', err.message)
  })
})

// ── Cleanup Expired Audit Logs (90 days) ──
cron.schedule('0 0 * * *', async () => {
  try {
    const cutOffDate = new Date()
    cutOffDate.setDate(cutOffDate.getDate() - 90)
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutOffDate } },
    })
    if (result.count > 0) {
      logger.info(`[Cron] Cleaned ${result.count} expired audit logs.`)
    }
  } catch (error) {
    logger.error('[Cron] Failed to clean expired audit logs:', error)
  }
})

// ── Cleanup Expired JWT Blacklist (every hour) ──
cron.schedule('0 * * * *', async () => {
  try {
    const cutOff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const result = await prisma.jwtBlacklist.deleteMany({
      where: { createdAt: { lt: cutOff } },
    })
    if (result.count > 0) {
      logger.info(`[Cron] Cleaned ${result.count} expired JWT blacklist entries.`)
    }
  } catch (error) {
    logger.error('[Cron] Failed to clean JWT blacklist:', error)
  }
})

// Export app for testing (supertest) — placed before listen
export default app

const PORT: number = Number(process.env.PORT) || 8080

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Backend Server is running on port ${PORT}`)
    logger.info(`API Docs available at http://localhost:${PORT}/api-docs`)
    logger.info(`Health check at http://localhost:${PORT}/health`)
  })
}
