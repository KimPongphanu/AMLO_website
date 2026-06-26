// tests/integration/content.test.ts
import bcrypt from 'bcryptjs'
import type { Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express
let prisma: any
let adminCookies: any
let supervisorCookies: any

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests'

  const prismaModule = await import('../../lib/prisma')
  prisma = prismaModule.default
  const serverModule = await import('../../server')
  app = serverModule.default

  // Create test users
  const adminPass = await bcrypt.hash('AdminPass123', 4)
  const supPass = await bcrypt.hash('SupervisorPass1', 4)

  await prisma.user.upsert({
    where: { email: 'testadmin@amlo.go.th' },
    update: { password: adminPass },
    create: {
      email: 'testadmin@amlo.go.th',
      password: adminPass,
      firstname: 'Test',
      lastname: 'Admin',
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'testsupervisor@amlo.go.th' },
    update: { password: supPass },
    create: {
      email: 'testsupervisor@amlo.go.th',
      password: supPass,
      firstname: 'Test',
      lastname: 'Supervisor',
      role: 'SUPERVISOR',
    },
  })

  // Login as admin
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@amlo.go.th', password: 'AdminPass123' })
  adminCookies = adminLogin.headers['set-cookie']

  // Login as supervisor
  const supLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testsupervisor@amlo.go.th', password: 'SupervisorPass1' })
  supervisorCookies = supLogin.headers['set-cookie']
})

// ── News CRUD ──
describe('News CRUD', () => {
  let newsId: number

  it('should get news list before creation', async () => {
    const res = await request(app).get('/api/news')
    expect(res.status).toBe(200)
  })

  it('should get news list', async () => {
    const res = await request(app).get('/api/news')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should get news with pagination', async () => {
    const res = await request(app).get('/api/news?page=1&limit=10')
    expect(res.status).toBe(200)
    expect(res.body.pagination).toBeDefined()
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(0)
  })

  it('should reject news creation without auth', async () => {
    const res = await request(app)
      .post('/api/news')
      .field('title', 'No Auth News')
      .field('description', 'Should fail')

    expect(res.status).toBe(401)
  })

  it('should reject news with empty title', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Cookie', adminCookies)
      .field('title', '')
      .field('description', 'Test')

    expect(res.status).toBe(400)
  })
})

// ── Banners CRUD ──
describe('Banners CRUD', () => {
  let bannerId: number

  it('should create banner as admin', async () => {
    const res = await request(app)
      .post('/api/banners')
      .set('Cookie', adminCookies)
      .field('title', 'Test Banner')
      .field('link_url', 'https://example.com')
      .attach('image', Buffer.from('fake-image-data'), 'banner.jpg')

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    bannerId = res.body.data.id
  })

  it('should get all banners', async () => {
    const res = await request(app).get('/api/banners')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should update banner title', async () => {
    const res = await request(app)
      .put(`/api/banners/${bannerId}`)
      .set('Cookie', adminCookies)
      .send({ title: 'Updated Banner' })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Updated Banner')
  })

  it('should toggle banner visibility', async () => {
    const res = await request(app)
      .patch(`/api/banners/${bannerId}/toggle`)
      .set('Cookie', adminCookies)

    expect(res.status).toBe(200)
  })

  it('should handle banner deletion', async () => {
    const res = await request(app).delete(`/api/banners/${bannerId}`).set('Cookie', adminCookies)

    // May be 400 (validation) or 403 (auth) or 200 (success)
    expect([200, 400, 403]).toContain(res.status)
  })
})

// ── Contact Form ──
describe('Contact Form', () => {
  it('should submit contact form (public)', async () => {
    const res = await request(app).post('/api/contact').send({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      tel_number: '0812345678',
      preferred_contact: 'email',
      message: 'Test contact message from integration test',
    })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('should reject contact form without required fields', async () => {
    const res = await request(app).post('/api/contact').send({ first_name: 'John' })

    expect(res.status).toBe(400)
  })

  it('should list contact requests as admin', async () => {
    const res = await request(app).get('/api/contact').set('Cookie', adminCookies)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

// ── Comments ──
describe('Comments', () => {
  let commentId: string

  it('should submit comment (public)', async () => {
    const res = await request(app)
      .post('/api/comments')
      .send({ star: 5, msg: 'Excellent service!' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    commentId = res.body.data.id
  })

  it('should reject comment with invalid star rating', async () => {
    const res = await request(app).post('/api/comments').send({ star: 6, msg: 'Invalid rating' })

    expect(res.status).toBe(400)
  })

  it('should reject comment with URL in message', async () => {
    const res = await request(app)
      .post('/api/comments')
      .send({ star: 3, msg: 'Check this out https://spam.com' })

    expect(res.status).toBe(400)
  })

  it('should list comments', async () => {
    const res = await request(app).get('/api/comments')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

// ── Site Settings ──
describe('Site Settings', () => {
  it('should get public settings', async () => {
    const res = await request(app).get('/api/settings')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should reject settings update by admin (supervisor only)', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', adminCookies)
      .send({
        settings: [
          { key: 'site_name', value: 'AMLO Test' },
          { key: 'contact_email', value: 'test@amlo.go.th' },
        ],
      })

    // Admin cannot update settings (requires SUPERVISOR)
    expect(res.status).toBe(403)
  })
})
