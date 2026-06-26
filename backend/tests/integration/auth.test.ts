import bcrypt from 'bcryptjs'
import type { Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express
let prisma: any

beforeAll(async () => {
  // Import prisma and app after env is set
  const prismaModule = await import('../../lib/prisma')
  prisma = prismaModule.default
  const serverModule = await import('../../server')
  app = serverModule.default

  // Create test user
  const password = await bcrypt.hash('TestPass123', 4)
  await prisma.user.upsert({
    where: { email: 'testuser@amlo.go.th' },
    update: { password },
    create: {
      email: 'testuser@amlo.go.th',
      password,
      firstname: 'Test',
      lastname: 'User',
      role: 'ADMIN',
    },
  })
})

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@amlo.go.th', password: 'TestPass123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.email).toBe('testuser@amlo.go.th')
    expect(res.body.user.role).toBe('ADMIN')
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@amlo.go.th', password: 'WrongPassword' })

    expect(res.status).toBe(401)
    expect(res.body.message).toContain('Invalid')
  })

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@amlo.go.th', password: 'TestPass123' })

    // May be 401 (invalid) or 429 (rate limited)
    expect([401, 429]).toContain(res.status)
  })
})

describe('GET /api/auth/me (authenticated)', () => {
  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('should return user data with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@amlo.go.th', password: 'TestPass123' })

    const cookies = loginRes.headers['set-cookie']
    expect(cookies).toBeDefined()

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies as any)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('testuser@amlo.go.th')
  })
})
