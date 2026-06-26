import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-for-integration-tests',
      DATABASE_URL: 'postgresql://postgres:12345@localhost:5432/backend_amlo_test',
    },
  },
})
