import { defineConfig, env } from '@prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // ⚠️ No hardcoded fallback password! Let it fail if DATABASE_URL is missing.
    url: env('DATABASE_URL') || undefined,
  },
})
