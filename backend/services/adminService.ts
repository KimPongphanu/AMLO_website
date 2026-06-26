// services/adminService.ts
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'
import { sanitizeText } from '../utils/sanitizer'

interface CreateAdminParams {
  email: string
  password: string
  firstname: string
  lastname: string
}

interface UpdateAdminParams {
  firstname?: string
  lastname?: string
}

const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) throw new AppError('Invalid email format', 400)
  const domainMatch = email.match(/@(.+)$/)
  if (!domainMatch || !domainMatch[1].includes('go.th')) {
    throw new AppError('Only organization email (.go.th) is allowed', 400)
  }
}

const validatePasswordStrength = (password: string, isSupervisor: boolean): void => {
  if (isSupervisor) {
    if (password.length < 16)
      throw new AppError('Supervisor password must be at least 16 characters', 400)
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{16,}$/
    if (!strongRegex.test(password))
      throw new AppError(
        'Supervisor password must contain uppercase, lowercase, number, and special character',
        400,
      )
  } else {
    if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400)
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/
    if (!mediumRegex.test(password))
      throw new AppError('Password must contain uppercase, lowercase, and number', 400)
  }
}

const addToPasswordHistory = async (userId: number, passwordHash: string): Promise<void> => {
  await prisma.passwordHistory.create({ data: { userId, passwordHash } })
}

export const createAdmin = async (params: CreateAdminParams, supervisorUuid?: string) => {
  const { email, password, firstname, lastname } = params

  if (!email || !password || !firstname || !lastname) {
    throw new AppError('All fields are required', 400)
  }

  validateEmail(email)
  validatePasswordStrength(password, false)

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existingUser) throw new AppError('Email already exists', 400)

  const hashedPassword = await bcrypt.hash(password, 12)
  const newAdmin = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstname: sanitizeText(firstname),
      lastname: sanitizeText(lastname),
      role: 'ADMIN',
      twoFactorMethod: 'NONE',
      twoFactorEnabled: false,
      forcePasswordReset: true,
    },
  })

  await addToPasswordHistory(newAdmin.id, hashedPassword)

  let supervisor = null
  if (supervisorUuid) {
    supervisor = await prisma.user.findUnique({ where: { uuid: supervisorUuid } })
  }

  return { admin: newAdmin, supervisor }
}

export const getAdmins = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit
  const where = { role: 'ADMIN' as const }

  const [admins, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        createdAt: true,
        recentOnline: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return { admins, total, page, totalPages: Math.ceil(total / limit) }
}

export const getAdminById = async (uuid: string) => {
  const admin = await prisma.user.findUnique({
    where: { uuid },
    select: {
      id: true,
      uuid: true,
      email: true,
      firstname: true,
      lastname: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
      createdAt: true,
      recentOnline: true,
    },
  })

  if (!admin || admin.role !== 'ADMIN') throw new AppError('Admin not found', 404)
  return admin
}

export const updateAdmin = async (
  uuid: string,
  params: UpdateAdminParams,
  supervisorUuid?: string,
) => {
  const admin = await prisma.user.findUnique({ where: { uuid } })
  if (!admin || admin.role !== 'ADMIN') throw new AppError('Admin not found', 404)

  const updateData: { firstname?: string; lastname?: string } = {}
  if (params.firstname) updateData.firstname = sanitizeText(params.firstname)
  if (params.lastname) updateData.lastname = sanitizeText(params.lastname)

  const updatedAdmin = await prisma.user.update({ where: { uuid }, data: updateData })

  let supervisor = null
  if (supervisorUuid) {
    supervisor = await prisma.user.findUnique({ where: { uuid: supervisorUuid } })
  }

  return { admin: updatedAdmin, supervisor, oldAdminEmail: admin.email, oldAdminId: admin.id }
}

export const banAdmin = async (uuid: string, reason: string, supervisorUuid?: string) => {
  if (!reason || !reason.trim()) throw new AppError('Reason is required for banning an admin', 400)

  const admin = await prisma.user.findUnique({ where: { uuid } })
  if (!admin || admin.role !== 'ADMIN') throw new AppError('Admin not found', 404)

  const updatedAdmin = await prisma.user.update({ where: { uuid }, data: { status: 'Inactive' } })

  const { revokeAllUserSessions } = await import('../middlewares/session')
  await revokeAllUserSessions(admin.id)

  let supervisor = null
  if (supervisorUuid) {
    supervisor = await prisma.user.findUnique({ where: { uuid: supervisorUuid } })
  }

  return { admin: updatedAdmin, supervisor }
}

export const unbanAdmin = async (uuid: string, reason: string, supervisorUuid?: string) => {
  if (!reason || !reason.trim())
    throw new AppError('Reason is required for unbanning an admin', 400)

  const admin = await prisma.user.findUnique({ where: { uuid } })
  if (!admin || admin.role !== 'ADMIN') throw new AppError('Admin not found', 404)

  const updatedAdmin = await prisma.user.update({ where: { uuid }, data: { status: 'Active' } })

  let supervisor = null
  if (supervisorUuid) {
    supervisor = await prisma.user.findUnique({ where: { uuid: supervisorUuid } })
  }

  return { admin: updatedAdmin, supervisor }
}

export const deleteAdmin = async (uuid: string, reason: string, supervisorUuid?: string) => {
  if (!reason || !reason.trim()) throw new AppError('Reason is required for deleting an admin', 400)

  const admin = await prisma.user.findUnique({ where: { uuid } })
  if (!admin || admin.role !== 'ADMIN') throw new AppError('Admin not found', 404)

  const { revokeAllUserSessions } = await import('../middlewares/session')
  await revokeAllUserSessions(admin.id)

  await prisma.user.delete({ where: { uuid } })

  let supervisor = null
  if (supervisorUuid) {
    supervisor = await prisma.user.findUnique({ where: { uuid: supervisorUuid } })
  }

  return { admin, supervisor }
}
