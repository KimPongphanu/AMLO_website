// prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import 'dotenv/config'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables')
  console.error('Please create a .env file with DATABASE_URL=postgresql://...')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function generateRecoveryKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < 10; i++) {
    keys.push(crypto.randomBytes(8).toString('hex').toUpperCase())
  }
  return keys
}

async function main() {
  console.log('Starting seeding...')

  const supervisorExists = await prisma.user.findFirst({
    where: { role: 'SUPERVISOR' as const },
  })

  if (!supervisorExists) {
    const hashedPassword = await bcrypt.hash('SuperSecurePassword123!@#', 12)

    const recoveryKeyStrings = generateRecoveryKeys()

    const rootSupervisor = await prisma.user.create({
      data: {
        email: 'kimpongphanu@gmail.com',
        password: hashedPassword,
        firstname: 'System',
        lastname: 'Supervisor',
        role: 'SUPERVISOR' as const,
        twoFactorMethod: 'NONE' as const,
        twoFactorEnabled: false,
        forcePasswordReset: false,
      },
    })

    for (const keyString of recoveryKeyStrings) {
      const keyHash = await bcrypt.hash(keyString, 12)
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      await prisma.recoveryKey.create({
        data: {
          userId: rootSupervisor.id,
          keyHash: keyHash,
          expiresAt: expiresAt,
        },
      })
    }

    console.log('Supervisor created:')
    console.log(`  Email: kimpongphanu@gmail.com`)
    console.log(`  Password: SuperSecurePassword123!@#`)
    console.log(`  Recovery Keys (SAVE THESE NOW):`)
    recoveryKeyStrings.forEach((key, idx) => {
      console.log(`    ${idx + 1}. ${key}`)
    })
    console.log('')
    console.log('IMPORTANT: These recovery keys are shown only once.')
    console.log('Print and store them in a secure location.')
  } else {
    console.log('Supervisor already exists. Skipping...')
  }

  const adminExists = await prisma.user.findFirst({
    where: { role: 'ADMIN' as const },
  })

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 12)

    await prisma.user.create({
      data: {
        email: 's6604062663183@email.kmutnb.ac.th',
        password: hashedPassword,
        firstname: 'System',
        lastname: 'Admin',
        role: 'ADMIN' as const,
        twoFactorMethod: 'NONE' as const,
        twoFactorEnabled: false,
        forcePasswordReset: true,
      },
    })

    console.log('Default Admin created:')
    console.log(`  Email: s6604062663183@email.kmutnb.ac.th`)
    console.log(`  Password: AdminPassword123!`)
  } else {
    console.log('Admin already exists. Skipping...')
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
