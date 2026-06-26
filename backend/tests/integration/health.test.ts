// tests/integration/health.test.ts
import type { Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express

beforeAll(async () => {
  // Set test environment before importing app
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests'

  // Import the Express app dynamically (after env is set)
  const module = await import('../../server')
  app = module.default
})

describe('Health Check', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status')
  })
})

describe('Root Endpoint', () => {
  it('GET / should return server running message', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Server is running')
  })
})

describe('Swagger Docs', () => {
  it('GET /api-docs.json should return valid OpenAPI spec', async () => {
    const res = await request(app).get('/api-docs.json')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('openapi')
    expect(res.body).toHaveProperty('info')
    expect(res.body.info.title).toContain('AMLO')
  })
})

describe('API v1 Routes', () => {
  it('should serve /api/v1/auth routes', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@test.com',
      password: 'test',
    })
    // Route exists — may return 401 (invalid), 200 (valid), or 429 (rate limited)
    expect([401, 200, 429]).toContain(res.status)
  })

  it('should serve /api/v1/news routes', async () => {
    const res = await request(app).get('/api/v1/news')
    expect(res.status).toBe(200)
  })

  it('should serve /api/v1/contact routes', async () => {
    const res = await request(app).post('/api/v1/contact').send({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      preferred_contact: 'email',
      message: 'Test message',
    })
    expect(res.status).toBe(201)
  })

  it('should serve /api/v1/comments routes', async () => {
    const res = await request(app).post('/api/v1/comments').send({
      star: 5,
      msg: 'Great website!',
    })
    expect(res.status).toBe(201)
  })
})
