import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import * as contentService from '../services/contentService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'
import { sanitizeText } from '../utils/sanitizer'

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { ipAddress } = getClientMetadata(req)
  const { star, msg } = req.body
  const safeMsg = msg ? sanitizeText(msg) : ''
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i
  if (urlRegex.test(safeMsg)) {
    res.status(400).json({ success: false, message: 'ไม่อนุญาตให้แนบลิงก์ในความคิดเห็น' })
    return
  }
  if (star === undefined || !safeMsg) {
    res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลคะแนนและข้อความให้ครบถ้วน' })
    return
  }
  const parsedStar = parseInt(star)
  if (isNaN(parsedStar) || parsedStar < 1 || parsedStar > 5) {
    res
      .status(400)
      .json({ success: false, message: 'คะแนนความพึงพอใจต้องอยู่ระหว่าง 1 ถึง 5 ดาวเท่านั้น' })
    return
  }
  if (safeMsg.length > 500) {
    res
      .status(400)
      .json({ success: false, message: 'ข้อความความคิดเห็นต้องยาวไม่เกิน 500 ตัวอักษร' })
    return
  }
  const newComment = await contentService.createComment(parsedStar, safeMsg)
  await logAudit(
    req,
    'CREATE_COMMENT_SUCCESS',
    `Public comment submitted successfully (Rating: ${parsedStar} stars, Comment ID: ${newComment.id})`,
    null,
  )
  res.status(201).json({
    success: true,
    message: 'บันทึกความคิดเห็นสำเร็จ ขอบคุณสำหรับคำแนะนำ',
    data: newComment,
  })
})

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { all } = req.query
  const page = parseInt(String(req.query.page)) || 1
  const limit = parseInt(String(req.query.limit)) || 10
  const result = await contentService.getComments(page, limit, all === 'true')
  res.status(200).json({
    success: true,
    data: result.comments,
    pagination: { total: result.total, page: result.page, totalPages: result.totalPages },
  })
})

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { id, isShow } = req.body
  if (!id || isShow === undefined) {
    res
      .status(400)
      .json({ success: false, message: 'กรุณาระบุข้อมูลรหัสไอดีและสถานะการแสดงผลให้ครบถ้วน' })
    return
  }
  const updatedComment = await contentService.updateComment(id, isShow)
  res
    .status(200)
    .json({ success: true, message: 'อัปเดตสถานะความคิดเห็นเรียบร้อยแล้ว', data: updatedComment })
})
