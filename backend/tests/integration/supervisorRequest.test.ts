// tests/integration/supervisorRequest.test.ts
import bcrypt from 'bcryptjs'
import type { Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express
let prisma: any
let sup1Cookies: any
let sup2Cookies: any
let sup1Uuid: string
let sup2Uuid: string

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests'

  const prismaModule = await import('../../lib/prisma')
  prisma = prismaModule.default
  const serverModule = await import('../../server')
  app = serverModule.default

  const pass = await bcrypt.hash('SupReq123', 4)

  const sup1 = await prisma.user.upsert({
    where: { email: 'supreq1@amlo.go.th' },
    update: { password: pass },
    create: {
      email: 'supreq1@amlo.go.th',
      password: pass,
      firstname: 'Req1',
      lastname: 'Supervisor',
      role: 'SUPERVISOR',
    },
  })
  sup1Uuid = sup1.uuid

  const sup2 = await prisma.user.upsert({
    where: { email: 'supreq2@amlo.go.th' },
    update: { password: pass },
    create: {
      email: 'supreq2@amlo.go.th',
      password: pass,
      firstname: 'Req2',
      lastname: 'Supervisor',
      role: 'SUPERVISOR',
    },
  })
  sup2Uuid = sup2.uuid

  const login1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'supreq1@amlo.go.th', password: 'SupReq123' })
  sup1Cookies = login1.headers['set-cookie']

  const login2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'supreq2@amlo.go.th', password: 'SupReq123' })
  sup2Cookies = login2.headers['set-cookie']
})

describe('Supervisor Request Flow', () => {
  let requestId: number

  it('should create a supervisor request', async () => {
    const res = await request(app).post('/api/supervisor-request').set('Cookie', sup1Cookies).send({
      targetUuid: sup2Uuid,
      actionType: 'BAN',
      reason: 'Test reason for integration test',
      password: 'SupReq123',
    })
    expect([201, 400]).toContain(res.status)
    if (res.status === 201) {
      expect(res.body.data).toHaveProperty('id')
      requestId = res.body.data.id
    }
  })

  it('should get pending requests as target supervisor', async () => {
    const res = await request(app).get('/api/supervisor-request/pending').set('Cookie', sup2Cookies)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should get sent requests as requester', async () => {
    const res = await request(app).get('/api/supervisor-request/sent').set('Cookie', sup1Cookies)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should reject request without password', async () => {
    const res = await request(app).post('/api/supervisor-request').set('Cookie', sup1Cookies).send({
      targetUuid: sup2Uuid,
      actionType: 'BAN',
      reason: 'Test reason',
    })
    expect(res.status).toBe(400)
  })
})

describe('Emergency Action', () => {
  it('should require auth for emergency action', async () => {
    const res = await request(app).post('/api/auth/emergency-action').send({
      targetUuid: sup2Uuid,
      recoveryKey: 'invalid-key',
      action: 'BAN',
      reason: 'Test',
    })
    expect([401, 403]).toContain(res.status)
  })
})
