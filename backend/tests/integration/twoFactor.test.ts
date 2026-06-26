// tests/integration/twoFactor.test.ts
import bcrypt from 'bcryptjs'
import type { Express } from 'express'
import speakeasy from 'speakeasy'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express
let prisma: any
let adminCookies: any

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests'

  const prismaModule = await import('../../lib/prisma')
  prisma = prismaModule.default
  const serverModule = await import('../../server')
  app = serverModule.default

  const pass = await bcrypt.hash('TwoFA1234', 4)
  await prisma.user.upsert({
    where: { email: '2fauser@amlo.go.th' },
    update: { password: pass },
    create: {
      email: '2fauser@amlo.go.th',
      password: pass,
      firstname: 'TwoFA',
      lastname: 'User',
      role: 'SUPERVISOR',
    },
  })

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: '2fauser@amlo.go.th', password: 'TwoFA1234' })
  adminCookies = login.headers['set-cookie']
})

describe('2FA API Routes', () => {
  it('should require auth for 2fa routes', async () => {
    const res = await request(app).post('/api/2fa/setup')
    expect([401, 403]).toContain(res.status)
  })

  it('should access 2fa setup with auth', async () => {
    const res = await request(app).post('/api/2fa/setup').set('Cookie', adminCookies)
    // May be 200 (success) or 400 (already setup)
    expect([200, 400]).toContain(res.status)
  })
})

// Unit tests (no API call needed)
describe('TOTP Generation (Unit)', () => {
  it('should generate valid TOTP', () => {
    const secret = speakeasy.generateSecret({ length: 20 })
    const token = speakeasy.totp({ secret: secret.base32, encoding: 'base32' })
    const isValid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token,
      window: 1,
    })
    expect(isValid).toBe(true)
  })
})
