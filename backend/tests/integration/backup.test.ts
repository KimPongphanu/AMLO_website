// tests/integration/backup.test.ts
import bcrypt from 'bcryptjs'
import type { Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express
let prisma: any
let supCookies: any
let adminCookies: any

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests'

  const prismaModule = await import('../../lib/prisma')
  prisma = prismaModule.default
  const serverModule = await import('../../server')
  app = serverModule.default

  const pass = await bcrypt.hash('Backup123', 4)
  const adminPass = await bcrypt.hash('Admin1234', 4)

  await prisma.user.upsert({
    where: { email: 'backupsup@amlo.go.th' },
    update: { password: pass },
    create: {
      email: 'backupsup@amlo.go.th',
      password: pass,
      firstname: 'Backup',
      lastname: 'Sup',
      role: 'SUPERVISOR',
    },
  })

  await prisma.user.upsert({
    where: { email: 'backupadmin@amlo.go.th' },
    update: { password: adminPass },
    create: {
      email: 'backupadmin@amlo.go.th',
      password: adminPass,
      firstname: 'Backup',
      lastname: 'Admin',
      role: 'ADMIN',
    },
  })

  const supLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'backupsup@amlo.go.th', password: 'Backup123' })
  supCookies = supLogin.headers['set-cookie']

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'backupadmin@amlo.go.th', password: 'Admin1234' })
  adminCookies = adminLogin.headers['set-cookie']
})

describe('Backup API', () => {
  it('should reject backup list without auth', async () => {
    const res = await request(app).get('/api/backups')
    expect(res.status).toBe(401)
  })

  it('should reject backup list as admin (supervisor only)', async () => {
    const res = await request(app).get('/api/backups').set('Cookie', adminCookies)
    expect(res.status).toBe(403)
  })

  it('should list backups as supervisor', async () => {
    const res = await request(app).get('/api/backups').set('Cookie', supCookies)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should reject create backup without auth', async () => {
    const res = await request(app).post('/api/backups')
    expect(res.status).toBe(401)
  })

  it('should reject download with invalid filename', async () => {
    const res = await request(app).get('/api/backups/invalid').set('Cookie', supCookies)
    expect([400, 404]).toContain(res.status)
  })

  it('should reject restore with invalid filename', async () => {
    const res = await request(app)
      .post('/api/backups/nonexistent/restore')
      .set('Cookie', supCookies)
    expect([400, 404]).toContain(res.status)
  })
})
