// tests/integration/departments.test.ts
import bcrypt from 'bcryptjs'
import type { Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express
let prisma: any
let adminCookies: any
let departmentId: number

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests'

  const prismaModule = await import('../../lib/prisma')
  prisma = prismaModule.default
  const serverModule = await import('../../server')
  app = serverModule.default

  const adminPass = await bcrypt.hash('DeptTest1', 4)
  await prisma.user.upsert({
    where: { email: 'deptadmin@amlo.go.th' },
    update: { password: adminPass },
    create: {
      email: 'deptadmin@amlo.go.th',
      password: adminPass,
      firstname: 'Dept',
      lastname: 'Admin',
      role: 'ADMIN',
    },
  })

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'deptadmin@amlo.go.th', password: 'DeptTest1' })
  adminCookies = login.headers['set-cookie']
})

describe('Departments CRUD', () => {
  it('should create department', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Cookie', adminCookies)
      .field('title', 'Test Department')
      .field('content', '<p>Department description</p>')
      .field('galleryUrls', '')
      .attach('cover_image', Buffer.from('fake-cover'), 'cover.jpg')

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id')
    departmentId = res.body.data.id
  })

  it('should list departments', async () => {
    const res = await request(app).get('/api/departments')
    expect(res.status).toBe(200)
    expect(res.body).toBeDefined()
  })

  it('should update department', async () => {
    const res = await request(app)
      .put(`/api/departments/${departmentId}`)
      .set('Cookie', adminCookies)
      .field('title', 'Updated Department')
      .field('content', '<p>Updated content</p>')
      .field('isGalleryUpdated', 'false')

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Updated Department')
  })

  it('should soft delete department', async () => {
    const res = await request(app)
      .delete(`/api/departments/${departmentId}`)
      .set('Cookie', adminCookies)

    expect(res.status).toBe(200)
  })
})

describe('Slider', () => {
  let slideId: number

  it('should list slides', async () => {
    const res = await request(app).get('/api/slider')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('Splash Popups', () => {
  let popupId: number

  it('should get active popup', async () => {
    const res = await request(app).get('/api/splash-popups/active')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('Check remaining static routes', () => {
  it('should access health route', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })
})
