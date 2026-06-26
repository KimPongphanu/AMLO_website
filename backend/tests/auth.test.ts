// tests/auth.test.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import { describe, expect, it } from 'vitest'

// ── Unit: Password Validation ──
describe('Password Validation', () => {
  it('should hash and compare passwords correctly', async () => {
    const password = 'Test1234!'
    const hash = await bcrypt.hash(password, 4)
    const isValid = await bcrypt.compare(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject incorrect passwords', async () => {
    const hash = await bcrypt.hash('Test1234!', 4)
    const isValid = await bcrypt.compare('WrongPassword1', hash)
    expect(isValid).toBe(false)
  })

  it('should enforce minimum password length', () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    expect(passwordRegex.test('Ab1')).toBe(false)
    expect(passwordRegex.test('Abcdef1!')).toBe(true)
    expect(passwordRegex.test('abcdefgh')).toBe(false)
    expect(passwordRegex.test('ABCDEFGH')).toBe(false)
    expect(passwordRegex.test('Abcdefgh')).toBe(false)
  })
})

// ── Unit: JWT Token ──
describe('JWT Token', () => {
  const secret = 'test-secret'
  const testPayload = { uuid: 'test-uuid', email: 'admin@amlo.go.th', role: 'ADMIN' }

  it('should sign and verify tokens correctly', () => {
    const token = jwt.sign(testPayload, secret, { expiresIn: '1h' })
    const decoded = jwt.verify(token, secret) as typeof testPayload
    expect(decoded.email).toBe(testPayload.email)
    expect(decoded.role).toBe(testPayload.role)
  })

  it('should reject tokens with wrong secret', () => {
    const token = jwt.sign(testPayload, secret, { expiresIn: '1h' })
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow()
  })

  it('should reject expired tokens', () => {
    const token = jwt.sign(testPayload, secret, { expiresIn: '0s' })
    expect(() => jwt.verify(token, secret)).toThrow()
  })
})

// ── Unit: TOTP (2FA) ──
describe('2FA / TOTP', () => {
  it('should generate and verify TOTP codes', () => {
    const secret = speakeasy.generateSecret({ length: 20 })
    const token = speakeasy.totp({ secret: secret.base32, encoding: 'base32' })
    const isValid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token,
      window: 1,
    })
    expect(isValid).toBe(true)
  })

  it('should reject invalid TOTP codes', () => {
    const secret = speakeasy.generateSecret({ length: 20 })
    const isValid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: '000000',
      window: 1,
    })
    expect(isValid).toBe(false)
  })
})

// ── Unit: XSS Sanitization ──
describe('XSS Sanitization', () => {
  it('should strip script tags', async () => {
    const { sanitizeText } = await import('../utils/sanitizer')
    const result = sanitizeText('<script>alert("xss")</script>Hello')
    expect(result).not.toContain('<script>')
    expect(result).toContain('Hello')
  })

  it('should strip event handlers', async () => {
    const { sanitizeText } = await import('../utils/sanitizer')
    const result = sanitizeText('<img onerror="alert(1)" src=x>')
    expect(result).not.toContain('onerror')
  })
})
