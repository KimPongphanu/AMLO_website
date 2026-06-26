// controllers/passwordResetController.ts
import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import prisma from '../lib/prisma'
import { sendEmail } from '../services/emailService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'

interface ResetPasswordBody {
  email: string
  otp?: string
  totp?: string
  resetToken?: string
  newPassword: string
}

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp, totp, resetToken, newPassword } =
      req.body as ResetPasswordBody
    const { ipAddress, userAgent } = getClientMetadata(req)

    if (!email || !newPassword) {
      res.status(400).json({ message: 'Email and new password are required' })
      return
    }

    if (
      (!otp || otp === '') &&
      (!totp || totp === '') &&
      (!resetToken || resetToken === '')
    ) {
      res.status(400).json({ message: 'OTP, TOTP, or reset token is required' })
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        message:
          'รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    // Verify TOTP (2FA Authenticator) if provided
    let verifiedTotp = false
    if (totp) {
      if (!user.twoFactorSecret) {
        res
          .status(400)
          .json({ message: 'ผู้ใช้ยังไม่ได้ตั้งค่า 2FA Authenticator' })
        return
      }

      verifiedTotp = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totp,
        window: 1,
      })

      if (!verifiedTotp) {
        res.status(400).json({ message: 'รหัส 2FA ไม่ถูกต้อง' })
        return
      }
    }

    // Verify OTP if provided (save id for later, don't mark used yet)
    let verifiedOtpId: string | null = null
    if (otp) {
      const emailOtps = await prisma.email_otps.findMany({
        where: {
          email: email.toLowerCase(),
          used: false,
          expiresAt: { gt: new Date() },
        },
      })

      let isOtpValid = false
      for (const record of emailOtps) {
        if (await bcrypt.compare(otp, record.otp)) {
          verifiedOtpId = record.id
          isOtpValid = true
          break
        }
      }

      if (!isOtpValid) {
        res.status(400).json({ message: 'Invalid or expired OTP' })
        return
      }
    }

    // Verify reset token from recovery key flow
    if (resetToken) {
      try {
        const decoded = jwt.verify(
          resetToken,
          process.env.JWT_SECRET as string,
        ) as { userId: number; purpose?: string }

        if (decoded.userId !== user.id) {
          res.status(400).json({ message: 'Reset token does not match user' })
          return
        }
      } catch {
        res.status(400).json({ message: 'Invalid or expired reset token' })
        return
      }
    }

    // Check password history (last 3 passwords)
    const history = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    for (const record of history) {
      const isMatch = await bcrypt.compare(newPassword, record.passwordHash)
      if (isMatch) {
        res.status(400).json({
          message: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านก่อนหน้า 3 ครั้งล่าสุด',
        })
        return
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        passwordHash: hashedPassword,
      },
    })

    // 🌟 Mark OTP as used ONLY after all validations pass and password is saved
    if (verifiedOtpId) {
      await prisma.email_otps.update({
        where: { id: verifiedOtpId },
        data: { used: true },
      })
    }

    await logAudit(
      req,
      'PASSWORD_RESET_SUCCESS',
      `Password reset successfully for user: ${user.email}${verifiedTotp ? ' (via 2FA)' : otp ? ' (via email OTP)' : resetToken ? ' (via recovery key)' : ''}`,
      user.id,
    )

    // Escape HTML-sensitive characters in user data to prevent email injection
    // Using numeric entities to avoid auto-formatter corruption
    const escapeHtml = (s: string): string =>
      s
        .replace(/&/g, '\x26\x23\x33\x38\x3b') // & via numeric
        .replace(/</g, '\x26\x6c\x74\x3b') // <
        .replace(/>/g, '\x26\x67\x74\x3b') // >
        .replace(/"/g, '\x26\x71\x75\x6f\x74\x3b') // "

    const html = `
      <h2>Password Reset Successful</h2>
      <p>Dear ${escapeHtml(user.firstname)} ${escapeHtml(user.lastname)},</p>
      <p>Your password has been successfully reset.</p>
      <h3>Details:</h3>
      <ul>
        <li>Time: ${new Date().toLocaleString('th-TH')}</li>
        <li>IP Address: ${escapeHtml(ipAddress)}</li>
        <li>Device: ${escapeHtml(userAgent)}</li>
      </ul>
      <p>If you did not perform this action, please contact IT support immediately.</p>
      <hr>
      <p><small>Anti-Money Laundering Office (AMLO)</small></p>
    `

    await sendEmail({
      to: user.email,
      subject: '[SECURITY] Your Password Has Been Reset',
      html,
    })

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    })
  },
)
