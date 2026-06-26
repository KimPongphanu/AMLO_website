// tests/setup.ts
import { afterAll, beforeAll } from 'vitest'

// Set test environment variables before any imports
process.env.JWT_SECRET = 'test-jwt-secret-for-ci'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:testpassword@localhost:5432/backend_amlo_test'

beforeAll(async () => {
  // Setup runs before all tests
  // In a full setup, we'd run migrations here
})

afterAll(async () => {
  // Cleanup after all tests
})
