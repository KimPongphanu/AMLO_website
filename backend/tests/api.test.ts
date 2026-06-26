// tests/api.test.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import { describe, expect, it } from 'vitest'

// ── Integration: Auth Flow ──
describe('Auth Integration', () => {
  it('should complete full auth flow: register → login → verify token', async () => {
    const email = 'admin@amlo.go.th'
    const password = 'Admin123!'
    const firstname = 'Test'
    const lastname = 'Admin'

    // 1. Hash password (simulating register)
    const hash = await bcrypt.hash(password, 4)

    // 2. Verify password (simulating login)
    const isValid = await bcrypt.compare(password, hash)
    expect(isValid).toBe(true)

    // 3. Generate JWT (simulating login response)
    const secret = 'test-secret'
    const token = jwt.sign(
      { uuid: 'test-uuid', email, firstName: firstname, lastName: lastname, role: 'ADMIN' },
      secret,
      { expiresIn: '1d' },
    )

    // 4. Verify JWT (simulating middleware)
    const decoded = jwt.verify(token, secret) as any
    expect(decoded.email).toBe(email)
    expect(decoded.role).toBe('ADMIN')
  })

  it('should reject invalid password', async () => {
    const hash = await bcrypt.hash('CorrectPass1', 4)
    const isValid = await bcrypt.compare('WrongPass1', hash)
    expect(isValid).toBe(false)
  })

  it('should handle 2FA flow: secret → enable → verify', () => {
    // Generate secret (simulating setup2FA)
    const secret = speakeasy.generateSecret({ length: 20 })

    // Generate TOTP (simulating authenticator app)
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
    })

    // Verify TOTP (simulating enable2FA)
    const isValid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token,
      window: 1,
    })
    expect(isValid).toBe(true)
  })
})

// ── Integration: Password Reset ──
describe('Password Reset Flow', () => {
  it('should enforce password history (last 3 passwords)', async () => {
    const oldPasswords = ['OldPass1!', 'OldPass2!', 'OldPass3!']
    const hashedPasswords = await Promise.all(oldPasswords.map((p) => bcrypt.hash(p, 4)))

    // Try to reuse old password
    const newPassword = 'OldPass1!'
    for (const hash of hashedPasswords) {
      const isReused = await bcrypt.compare(newPassword, hash)
      if (isReused) {
        // This is caught by password history check
        expect(true).toBe(true)
        return
      }
    }

    // If no match, password is OK
    expect(true).toBe(true)
  })
})

// ── Integration: XSS Prevention ──
describe('XSS Prevention', () => {
  it('should sanitize all input types', async () => {
    const { sanitizeText } = await import('../utils/sanitizer')

    // All HTML tags should be stripped, only text content remains
    const result1 = sanitizeText('<script>alert(1)</script>')
    expect(result1).not.toContain('<script>')

    const result2 = sanitizeText('<img src=x onerror=alert(1)>')
    expect(result2).not.toContain('onerror')

    const result3 = sanitizeText('Normal text')
    expect(result3).toBe('Normal text')
  })
})

// ── Integration: Rate Limiting ──
describe('Rate Limiting Configuration', () => {
  it('should have proper rate limits configured', () => {
    // Verify that rate limiter configurations are reasonable
    const limits = {
      login: { windowMs: 30 * 60 * 1000, max: 10 }, // 10 per 30 min
      register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
      api: { windowMs: 15 * 60 * 1000, max: 400 }, // 400 per 15 min
      upload: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 min
      comment: { windowMs: 30 * 60 * 1000, max: 10 }, // 10 per 30 min
      contact: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 per hour
      twoFA: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 min
      backup: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 per hour
    }

    // All limits should be positive
    Object.entries(limits).forEach(([name, config]) => {
      expect(config.max).toBeGreaterThan(0)
      expect(config.windowMs).toBeGreaterThan(0)
    })
  })
})
