// services/emailService.ts
import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Escape HTML-sensitive characters to prevent email template injection.
 * All user-supplied data interpolated into HTML templates MUST use this.
 */
const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '\x26\x61\x6d\x70\x3b')
    .replace(/</g, '\x26\x6c\x74\x3b')
    .replace(/>/g, '\x26\x67\x74\x3b')
    .replace(/"/g, '\x26\x71\x75\x6f\x74\x3b')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // Configurable via env
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  } catch (error) {
    console.error('Email sending failed:', error)
  }
}

export const sendLoginAlertEmail = async (
  email: string,
  name: string,
  ipAddress: string,
  userAgent: string,
  timestamp: Date,
): Promise<void> => {
  const safeName = escapeHtml(name)
  const safeIp = escapeHtml(ipAddress)
  const safeUa = escapeHtml(userAgent)

  const html = `
    <h2>Security Alert: New Login Detected</h2>
    <p>Dear ${safeName},</p>
    <p>A new login to your account was detected.</p>
    <h3>Login Details:</h3>
    <ul>
      <li>Time: ${timestamp.toLocaleString('th-TH')}</li>
      <li>IP Address: ${safeIp}</li>
      <li>Device: ${safeUa}</li>
    </ul>
    <p>If this was not you, please contact IT support immediately.</p>
    <hr>
    <p><small>Anti-Money Laundering Office (AMLO)</small></p>
  `

  await sendEmail({
    to: email,
    subject: '[SECURITY] New Login to Your AMLO Account',
    html,
  })
}

export const sendRecoveryKeyUsedAlert = async (
  email: string,
  name: string,
  ipAddress: string,
  userAgent: string,
): Promise<void> => {
  const safeName = escapeHtml(name)
  const safeIp = escapeHtml(ipAddress)
  const safeUa = escapeHtml(userAgent)

  const html = `
    <h2>Security Alert: Recovery Key Used</h2>
    <p>Dear ${safeName},</p>
    <p>A recovery key was used to access your account.</p>
    <h3>Access Details:</h3>
    <ul>
      <li>IP Address: ${safeIp}</li>
      <li>Device: ${safeUa}</li>
    </ul>
    <p><strong>If you did not perform this action, your account may be compromised.</strong></p>
    <p>Please change your password immediately and check your recovery keys.</p>
    <hr>
    <p><small>Anti-Money Laundering Office (AMLO)</small></p>
  `

  await sendEmail({
    to: email,
    subject: '[URGENT] Recovery Key Used on Your Account',
    html,
  })
}

export const sendUserActionAlert = async (
  adminEmail: string,
  adminName: string,
  targetEmail: string,
  targetName: string,
  action: string,
  reason: string,
  performedBy: string,
  ipAddress: string,
): Promise<void> => {
  const safeAdminName = escapeHtml(adminName)
  const safeTargetName = escapeHtml(targetName)
  const safeTargetEmail = escapeHtml(targetEmail)
  const safeAction = escapeHtml(action)
  const safeReason = escapeHtml(reason)
  const safePerformedBy = escapeHtml(performedBy)
  const safeIp = escapeHtml(ipAddress)

  const html = `
    <h2>&#9888;&#65039; Admin Action Alert: ${safeAction}</h2>
    <p>Dear ${safeAdminName},</p>
    <h3>Action Details:</h3>
    <ul>
      <li><strong>Action:</strong> ${safeAction}</li>
      <li><strong>Performed By:</strong> ${safePerformedBy}</li>
      <li><strong>Target User:</strong> ${safeTargetName} (${safeTargetEmail})</li>
      <li><strong>Reason:</strong> ${safeReason}</li>
      <li><strong>IP Address:</strong> ${safeIp}</li>
      <li><strong>Time:</strong> ${new Date().toLocaleString('th-TH')}</li>
    </ul>
    <p>If you did not authorize this action, please:</p>
    <ol>
      <li>Use your recovery key to login immediately</li>
      <li>Suspend the compromised supervisor account</li>
      <li>Contact IT Support</li>
    </ol>
    <hr>
    <p><small>Anti-Money Laundering Office (AMLO)</small></p>
  `

  await sendEmail({
    to: adminEmail,
    subject: `[ACTION REQUIRED] ${safeAction} Performed on Admin Account`,
    html,
  })
}

export const sendOTPEmail = async (
  email: string,
  otp: string,
  expiresInMinutes: number,
): Promise<void> => {
  const html = `
    <h2>Your OTP Verification Code</h2>
    <p>You requested a one-time password (OTP) for AMLO system access.</p>
    <h1 style="font-size: 32px; letter-spacing: 5px;">${escapeHtml(otp)}</h1>
    <p>This code will expire in ${expiresInMinutes} minutes.</p>
    <p>If you did not request this code, please ignore this email.</p>
    <hr>
    <p><small>Anti-Money Laundering Office (AMLO)</small></p>
  `

  await sendEmail({
    to: email,
    subject: 'Your AMLO OTP Verification Code',
    html,
  })
}
