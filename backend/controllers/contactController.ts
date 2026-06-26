import { Response } from 'express'
import asyncHandler from 'express-async-handler'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import * as contentService from '../services/contentService'
import { sendEmail } from '../services/emailService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'
import { sanitizeText } from '../utils/sanitizer'

export const createContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ipAddress } = getClientMetadata(req)
  const first_name = sanitizeText(req.body.first_name || req.body.firstName || '')
  const last_name = sanitizeText(req.body.last_name || req.body.lastName || '')
  const email = (req.body.email || '').trim().toLowerCase()
  const tel_number = req.body.tel_number || req.body.telNumber || ''
  const preferred_contact = sanitizeText(
    req.body.preferred_contact || req.body.preferredContact || '',
  )
  const message = sanitizeText(req.body.message || '')

  if (!first_name || !last_name || !email || !preferred_contact || !message) {
    res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' })
    return
  }

  const newRequest = await contentService.createContact({
    first_name,
    last_name,
    email,
    tel_number,
    preferred_contact,
    message,
  })
  await logAudit(
    req,
    'CREATE_CONTACT_SUCCESS',
    `Public contact form submitted successfully (Name: ${first_name} ${last_name}, Email: ${email}, Request ID: ${newRequest.id})`,
    null,
  )

  try {
    const supervisors = await prisma.user.findMany({
      where: { role: 'SUPERVISOR' },
      select: { email: true },
    })
    if (supervisors.length > 0) {
      const html = `<h2>New Contact Request</h2><p>From: ${first_name} ${last_name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`
      for (const sup of supervisors) {
        await sendEmail({
          to: sup.email,
          subject: `New Contact from ${first_name} ${last_name}`,
          html,
        }).catch(() => {})
      }
    }
  } catch {
    /* ignore email errors */
  }

  res
    .status(201)
    .json({ success: true, message: 'บันทึกข้อความการติดต่อเรียบร้อยแล้ว', data: newRequest })
})

export const getContactRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requests = await contentService.getContactRequests()
  res.status(200).json({ success: true, data: requests })
})

export const updateContactStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ipAddress } = getClientMetadata(req)
  const { id, status } = req.body
  if (!id || !status) {
    res.status(400).json({ success: false, message: 'กรุณาระบุข้อมูล id และสถานะให้ครบถ้วน' })
    return
  }
  const updatedRequest = await contentService.updateContactStatus(id, status)
  await logAudit(
    req,
    'UPDATE_CONTACT_STATUS_SUCCESS',
    `Admin updated contact request status (Request ID: ${id}, New status: "${status}")`,
    undefined,
  )
  res
    .status(200)
    .json({ success: true, message: 'อัปเดตสถานะข้อมูลเรียบร้อยแล้ว', data: updatedRequest })
})
