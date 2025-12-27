import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock redis module before importing security
vi.mock('@/lib/redis', () => ({
  redis: {
    zremrangebyscore: vi.fn(),
    zcard: vi.fn().mockResolvedValue(0),
    zrange: vi.fn().mockResolvedValue([]),
    zadd: vi.fn(),
    expire: vi.fn(),
  },
  RedisKeys: {
    exhibitionPublic: (id: string) => `cache:exhibition:${id}`,
    teamArtworks: (teamId: string) => `cache:artworks:${teamId}`,
  },
}))

// Import after mocking
import {
  sanitizeHtml,
  isSafeIdentifier,
  checkPasswordStrength,
  isValidUUID,
  isValidEmail,
  safeJsonParse,
  maskSensitiveData,
  isAllowedFileType,
  generateCsrfToken,
} from '@/lib/security'

describe('Security Utils', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>'
      expect(sanitizeHtml(input)).toBe('<p>Hello</p>')
    })

    it('should remove on* event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">'
      expect(sanitizeHtml(input)).not.toContain('onerror')
    })

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click</a>'
      expect(sanitizeHtml(input)).not.toContain('javascript:')
    })

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('')
    })

    it('should preserve safe HTML', () => {
      const input = '<p>Safe content</p>'
      expect(sanitizeHtml(input)).toBe('<p>Safe content</p>')
    })
  })

  describe('isSafeIdentifier', () => {
    it('should accept alphanumeric strings', () => {
      expect(isSafeIdentifier('abc123')).toBe(true)
      expect(isSafeIdentifier('test_name')).toBe(true)
      expect(isSafeIdentifier('my-id')).toBe(true)
    })

    it('should reject special characters', () => {
      expect(isSafeIdentifier("'; DROP TABLE--")).toBe(false)
      expect(isSafeIdentifier('<script>')).toBe(false)
      expect(isSafeIdentifier('a b')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isSafeIdentifier('')).toBe(false)
    })
  })

  describe('checkPasswordStrength', () => {
    it('should give low score to weak passwords', () => {
      const result = checkPasswordStrength('123')
      expect(result.score).toBeLessThan(3)
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it('should give high score to strong passwords', () => {
      const result = checkPasswordStrength('MyStr0ng!P@ssword123')
      expect(result.score).toBeGreaterThanOrEqual(5)
    })

    it('should detect common weak patterns', () => {
      const result = checkPasswordStrength('password123')
      expect(result.feedback).toContain('避免使用常見密碼模式')
    })

    it('should require minimum length', () => {
      const result = checkPasswordStrength('Aa1!')
      expect(result.feedback).toContain('密碼至少需要 8 個字元')
    })
  })

  describe('isValidUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
      expect(isValidUUID('')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {})
      expect(result).toEqual({ key: 'value' })
    })

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true }
      const result = safeJsonParse('not json', fallback)
      expect(result).toEqual(fallback)
    })

    it('should handle arrays', () => {
      const result = safeJsonParse('[1, 2, 3]', [])
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('maskSensitiveData', () => {
    it('should mask middle characters', () => {
      expect(maskSensitiveData('1234567890')).toBe('12******90')
    })

    it('should handle short strings', () => {
      expect(maskSensitiveData('abc')).toBe('***')
    })

    it('should support custom visible lengths', () => {
      expect(maskSensitiveData('1234567890', 3, 3)).toBe('123****890')
    })

    it('should handle email-like strings', () => {
      const result = maskSensitiveData('test@example.com')
      expect(result.startsWith('te')).toBe(true)
      expect(result.endsWith('om')).toBe(true)
    })
  })

  describe('isAllowedFileType', () => {
    it('should accept valid image types', () => {
      expect(isAllowedFileType('image/jpeg', 'image')).toBe(true)
      expect(isAllowedFileType('image/png', 'image')).toBe(true)
      expect(isAllowedFileType('image/gif', 'image')).toBe(true)
      expect(isAllowedFileType('image/webp', 'image')).toBe(true)
    })

    it('should reject invalid image types', () => {
      expect(isAllowedFileType('image/svg+xml', 'image')).toBe(false)
      expect(isAllowedFileType('text/plain', 'image')).toBe(false)
    })

    it('should accept valid document types', () => {
      expect(isAllowedFileType('application/pdf', 'document')).toBe(true)
    })

    it('should accept valid video types', () => {
      expect(isAllowedFileType('video/mp4', 'video')).toBe(true)
      expect(isAllowedFileType('video/webm', 'video')).toBe(true)
    })
  })

  describe('generateCsrfToken', () => {
    it('should generate 64-character hex string', () => {
      const token = generateCsrfToken()
      expect(token).toHaveLength(64)
      expect(/^[0-9a-f]+$/.test(token)).toBe(true)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1).not.toBe(token2)
    })
  })
})
