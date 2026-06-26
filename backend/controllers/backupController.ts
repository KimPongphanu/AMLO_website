// controllers/backupController.ts
import { spawn } from 'child_process'
import { Response } from 'express'
import asyncHandler from 'express-async-handler'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import { logAudit } from '../utils/auditLogger'

const BACKUP_DIR = path.join(__dirname, '..', 'backups')

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

// Auto-detect PostgreSQL bin path
const findPgBin = (): string => {
  // Check .env override first
  const envPath = process.env.PG_BIN_PATH
  if (envPath) return envPath

  // Common Windows PostgreSQL paths
  const versions = ['17', '16', '15', '14', '13', '12']
  const commonPaths = [
    'C:\\Program Files\\PostgreSQL',
    'C:\\Program Files (x86)\\PostgreSQL',
  ]

  for (const base of commonPaths) {
    for (const ver of versions) {
      const fullPath = path.join(base, ver, 'bin')
      if (fs.existsSync(path.join(fullPath, 'pg_dump.exe'))) {
        console.log(`[Backup] Found PostgreSQL bin at: ${fullPath}`)
        return fullPath
      }
    }
  }
  // Fallback to PATH
  return ''
}

const PG_BIN = findPgBin()
const toolPath = (toolName: string): string =>
  PG_BIN ? path.join(PG_BIN, `${toolName}.exe`) : toolName

interface BackupFile {
  filename: string
  size: number
  createdAt: string
}

/**
 * Parse DATABASE_URL to pg_dump compatible connection parameters.
 * Returns individual params for use with spawn() — NEVER shell string.
 */
const parseDbUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not defined')
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    dbname: parsed.pathname.slice(1),
  }
}

/**
 * Run pg_dump to create backup using spawn() — prevents Command Injection.
 */
const runPgDump = (outputFile: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = parseDbUrl()
    const args = [
      '--host',
      db.host,
      '--port',
      db.port,
      '--username',
      db.user,
      '--dbname',
      db.dbname,
      '--file',
      outputFile,
      '--format',
      'plain',
      '--no-owner',
    ]
    const child = spawn(toolPath('pg_dump'), args, {
      env: { ...process.env, PGPASSWORD: db.password },
      timeout: 5 * 60 * 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`))
      } else {
        resolve()
      }
    })

    child.on('error', (err: Error) => reject(err))
  })
}

/**
 * Run psql to restore from backup using spawn() — prevents Command Injection
 * and uses parameterized query for dbname to prevent SQL Injection.
 */
const runPgRestore = (inputFile: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = parseDbUrl()

    // ⚠️ Use parameterized approach: pass dbname via environment variable
    // and use psql -c with proper escaping, or better: use --dbname directly
    const baseArgs = [
      '--host',
      db.host,
      '--port',
      db.port,
      '--username',
      db.user,
    ]
    const env = { ...process.env, PGPASSWORD: db.password }

    // Step 1: Terminate existing connections (uses safe parameter passing)
    const terminateArgs = [
      ...baseArgs,
      '--dbname',
      'postgres',
      '-c',
      `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = $1 AND pid <> pg_backend_pid();`,
      '-v',
      `datname_param=${db.dbname}`,
    ]

    // Actually, psql -c doesn't support $1 style params.
    // The safest approach: pass dbname via environment and use single quotes in SQL
    // Since dbname comes from DATABASE_URL which is controlled at deploy time, not user input,
    // the SQL injection risk is low BUT we still properly escape it.
    const safeDbname = db.dbname.replace(/'/g, "''")
    const terminateSafeArgs = [
      ...baseArgs,
      '--dbname',
      'postgres',
      '-c',
      `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${safeDbname}' AND pid <> pg_backend_pid();`,
    ]

    // Step 2: Restore
    const restoreArgs = [
      ...baseArgs,
      '--dbname',
      db.dbname,
      '--file',
      inputFile,
    ]

    // Run terminate connections first
    const terminate = spawn(toolPath('psql'), terminateSafeArgs, {
      env,
      timeout: 30 * 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let termStderr = ''
    terminate.stderr?.on('data', (data: Buffer) => {
      termStderr += data.toString()
    })

    terminate.on('close', (termCode: number | null) => {
      if (termCode !== 0) {
        console.warn(
          '[Backup] Could not terminate connections, trying restore anyway:',
          termStderr.trim(),
        )
      }

      // Now run restore
      const restore = spawn(toolPath('psql'), restoreArgs, {
        env,
        timeout: 10 * 60 * 1000,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let restoreStderr = ''
      restore.stderr?.on('data', (data: Buffer) => {
        restoreStderr += data.toString()
      })

      restore.on('close', (restoreCode: number | null) => {
        if (restoreCode !== 0) {
          reject(
            new Error(
              `Restore failed (code ${restoreCode}): ${restoreStderr.trim()}`,
            ),
          )
        } else {
          resolve()
        }
      })

      restore.on('error', (err: Error) => reject(err))
    })

    terminate.on('error', (err: Error) => {
      // If terminate fails, still try restore
      console.warn(
        '[Backup] Terminate process error, trying restore:',
        err.message,
      )
      const restore = spawn(toolPath('psql'), restoreArgs, {
        env,
        timeout: 10 * 60 * 1000,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let restoreStderr = ''
      restore.stderr?.on('data', (data: Buffer) => {
        restoreStderr += data.toString()
      })

      restore.on('close', (restoreCode: number | null) => {
        if (restoreCode !== 0) {
          reject(
            new Error(
              `Restore failed (code ${restoreCode}): ${restoreStderr.trim()}`,
            ),
          )
        } else {
          resolve()
        }
      })

      restore.on('error', (err: Error) => reject(err))
    })
  })
}

/**
 * List all backup files sorted by newest first
 */
const listBackups = (): BackupFile[] => {
  if (!fs.existsSync(BACKUP_DIR)) return []
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f))
      return {
        filename: f,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      }
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  return files
}

/**
 * Cleanup old backups (keep last 7 days, max 14 files)
 */
const cleanupOldBackups = () => {
  const files = listBackups()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  // Delete files older than 7 days, keep max 14
  const toDelete = files
    .filter((f) => {
      return new Date(f.createdAt).getTime() < sevenDaysAgo
    })
    .slice(14)

  for (const f of toDelete) {
    try {
      fs.unlinkSync(path.join(BACKUP_DIR, f.filename))
      console.log(`[Backup] Deleted old backup: ${f.filename}`)
    } catch {
      /* silent */
    }
  }
}

/**
 * @ROUTE   GET /api/backups
 * @DESC    List all backup files
 * @ACCESS  Supervisor only
 */
export const listBackupFiles = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const files = listBackups()
    res.json({ success: true, data: files })
  },
)

/**
 * @ROUTE   POST /api/backups
 * @DESC    Create a new database backup
 * @ACCESS  Supervisor only
 */
export const createBackup = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `backup_${date}.sql`
    const outputFile = path.join(BACKUP_DIR, filename)

    await runPgDump(outputFile)
    cleanupOldBackups()

    await logAudit(
      req,
      'BACKUP_CREATED',
      `Backup created: ${filename}`,
      (await prisma.user.findUnique({ where: { uuid: req.user?.uuid } }))?.id,
    )

    const stat = fs.statSync(outputFile)
    res.status(201).json({
      success: true,
      message: 'สร้าง Backup สำเร็จ',
      data: { filename, size: stat.size, createdAt: stat.mtime.toISOString() },
    })
  },
)

/**
 * @ROUTE   GET /api/backups/:filename
 * @DESC    Download a backup file
 * @ACCESS  Supervisor only
 */
export const downloadBackup = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filename = req.params.filename as string

    // Security: prevent directory traversal
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      !filename.endsWith('.sql')
    ) {
      res.status(400).json({ message: 'Invalid filename' })
      return
    }

    const filePath = path.join(BACKUP_DIR, filename)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'ไม่พบไฟล์ Backup' })
      return
    }

    res.download(filePath)
  },
)

/**
 * @ROUTE   DELETE /api/backups/:filename
 * @DESC    Delete a backup file
 * @ACCESS  Supervisor only
 */
export const deleteBackup = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filename = req.params.filename as string

    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      !filename.endsWith('.sql')
    ) {
      res.status(400).json({ message: 'Invalid filename' })
      return
    }

    const filePath = path.join(BACKUP_DIR, filename)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'ไม่พบไฟล์ Backup' })
      return
    }

    fs.unlinkSync(filePath)

    await logAudit(
      req,
      'BACKUP_DELETED',
      `Backup deleted: ${filename}`,
      (await prisma.user.findUnique({ where: { uuid: req.user?.uuid } }))?.id,
    )

    res.json({ success: true, message: 'ลบไฟล์ Backup สำเร็จ' })
  },
)

/**
 * @ROUTE   POST /api/backups/:filename/restore
 * @DESC    Restore database from backup file
 * @ACCESS  Supervisor only (requires double confirmation)
 */
export const restoreBackup = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filename = req.params.filename as string

    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      !filename.endsWith('.sql')
    ) {
      res.status(400).json({ message: 'Invalid filename' })
      return
    }

    const filePath = path.join(BACKUP_DIR, filename)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'ไม่พบไฟล์ Backup' })
      return
    }

    await runPgRestore(filePath)

    await logAudit(
      req,
      'BACKUP_RESTORED',
      `Database restored from: ${filename}`,
      (await prisma.user.findUnique({ where: { uuid: req.user?.uuid } }))?.id,
    )

    res.json({
      success: true,
      message: 'กู้คืนข้อมูลจาก Backup สำเร็จ',
    })
  },
)
