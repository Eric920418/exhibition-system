import { describe, it, expect, vi } from 'vitest'
import { createUserSchema, updateUserSchema, userQuerySchema, changePasswordSchema } from '@/lib/validations/user'

// Mock Prisma UserRole enum
vi.mock('@prisma/client', () => ({
  UserRole: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    CURATOR: 'CURATOR',
    TEAM_LEADER: 'TEAM_LEADER',
  },
}))

describe('User Validations', () => {
  describe('createUserSchema', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'CURATOR' as const,
    }

    it('should validate correct data', () => {
      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = createUserSchema.safeParse({ ...validData, email: 'invalid-email' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email')
      }
    })

    it('should reject short password', () => {
      const result = createUserSchema.safeParse({ ...validData, password: '12345' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('6')
      }
    })

    it('should reject short name', () => {
      const result = createUserSchema.safeParse({ ...validData, name: 'A' })
      expect(result.success).toBe(false)
    })

    it('should reject long name', () => {
      const result = createUserSchema.safeParse({ ...validData, name: 'A'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('should accept valid roles', () => {
      const roles = ['SUPER_ADMIN', 'CURATOR', 'TEAM_LEADER'] as const
      roles.forEach(role => {
        const result = createUserSchema.safeParse({ ...validData, role })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid role', () => {
      const result = createUserSchema.safeParse({ ...validData, role: 'INVALID_ROLE' })
      expect(result.success).toBe(false)
    })

    it('should accept optional avatarUrl', () => {
      const result = createUserSchema.safeParse({
        ...validData,
        avatarUrl: 'https://example.com/avatar.jpg',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid avatarUrl', () => {
      const result = createUserSchema.safeParse({
        ...validData,
        avatarUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('should default isActive to true', () => {
      const result = createUserSchema.parse(validData)
      expect(result.isActive).toBe(true)
    })
  })

  describe('updateUserSchema', () => {
    it('should allow partial updates', () => {
      const result = updateUserSchema.safeParse({ name: 'Updated Name' })
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateUserSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate email format when provided', () => {
      const result = updateUserSchema.safeParse({ email: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should allow null avatarUrl', () => {
      const result = updateUserSchema.safeParse({ avatarUrl: null })
      expect(result.success).toBe(true)
    })

    it('should validate password length when provided', () => {
      const result = updateUserSchema.safeParse({ password: '123' })
      expect(result.success).toBe(false)
    })
  })

  describe('userQuerySchema', () => {
    it('should use default values', () => {
      const result = userQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should transform isActive string to boolean', () => {
      const result = userQuerySchema.parse({ isActive: 'true' })
      expect(result.isActive).toBe(true)
    })

    it('should parse role filter', () => {
      const result = userQuerySchema.parse({ role: 'CURATOR' })
      expect(result.role).toBe('CURATOR')
    })

    it('should parse search term', () => {
      const result = userQuerySchema.parse({ search: 'test' })
      expect(result.search).toBe('test')
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate correct data', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty current password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'newpassword123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject short new password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: '12345',
      })
      expect(result.success).toBe(false)
    })
  })
})
