import { describe, it, expect } from 'vitest'
import { createExhibitionSchema, updateExhibitionSchema, exhibitionQuerySchema } from '@/lib/validations/exhibition'

describe('Exhibition Validations', () => {
  describe('createExhibitionSchema', () => {
    const validData = {
      name: '2024 畢業展',
      year: 2024,
      slug: 'graduation-2024',
      description: '年度畢業展覽',
      startDate: '2024-06-01T00:00:00.000Z',
      endDate: '2024-06-30T00:00:00.000Z',
      status: 'DRAFT' as const,
    }

    it('should validate correct data', () => {
      const result = createExhibitionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = createExhibitionSchema.safeParse({ ...validData, name: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('name')
      }
    })

    it('should reject invalid slug format', () => {
      const result = createExhibitionSchema.safeParse({ ...validData, slug: 'Invalid Slug!' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('slug')
      }
    })

    it('should accept valid slug with numbers and hyphens', () => {
      const result = createExhibitionSchema.safeParse({ ...validData, slug: 'exhibition-2024-v1' })
      expect(result.success).toBe(true)
    })

    it('should reject year below 2000', () => {
      const result = createExhibitionSchema.safeParse({ ...validData, year: 1999 })
      expect(result.success).toBe(false)
    })

    it('should reject year above 2100', () => {
      const result = createExhibitionSchema.safeParse({ ...validData, year: 2101 })
      expect(result.success).toBe(false)
    })

    it('should reject end date before start date', () => {
      const result = createExhibitionSchema.safeParse({
        ...validData,
        startDate: '2024-06-30T00:00:00.000Z',
        endDate: '2024-06-01T00:00:00.000Z',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('結束日期必須晚於開始日期')
      }
    })

    it('should reject invalid status', () => {
      const result = createExhibitionSchema.safeParse({ ...validData, status: 'INVALID' })
      expect(result.success).toBe(false)
    })

    it('should accept valid status values', () => {
      const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
      statuses.forEach(status => {
        const result = createExhibitionSchema.safeParse({ ...validData, status })
        expect(result.success).toBe(true)
      })
    })

    it('should handle empty description as undefined', () => {
      const result = createExhibitionSchema.safeParse({ ...validData, description: '' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBeUndefined()
      }
    })

    it('should validate poster URL format', () => {
      const result = createExhibitionSchema.safeParse({
        ...validData,
        posterUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid poster URL', () => {
      const result = createExhibitionSchema.safeParse({
        ...validData,
        posterUrl: 'https://example.com/poster.jpg',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateExhibitionSchema', () => {
    it('should allow partial updates', () => {
      const result = updateExhibitionSchema.safeParse({ name: 'Updated Name' })
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateExhibitionSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate date range when both provided', () => {
      const result = updateExhibitionSchema.safeParse({
        startDate: '2024-06-30T00:00:00.000Z',
        endDate: '2024-06-01T00:00:00.000Z',
      })
      expect(result.success).toBe(false)
    })

    it('should allow only start date update', () => {
      const result = updateExhibitionSchema.safeParse({
        startDate: '2024-06-01T00:00:00.000Z',
      })
      expect(result.success).toBe(true)
    })

    it('should allow only end date update', () => {
      const result = updateExhibitionSchema.safeParse({
        endDate: '2024-06-30T00:00:00.000Z',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('exhibitionQuerySchema', () => {
    it('should use default values', () => {
      const result = exhibitionQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should parse page as number', () => {
      const result = exhibitionQuerySchema.parse({ page: '5' })
      expect(result.page).toBe(5)
    })

    it('should parse limit as number', () => {
      const result = exhibitionQuerySchema.parse({ limit: '20' })
      expect(result.limit).toBe(20)
    })

    it('should reject limit above 100', () => {
      const result = exhibitionQuerySchema.safeParse({ limit: '200' })
      expect(result.success).toBe(false)
    })

    it('should reject page below 1', () => {
      const result = exhibitionQuerySchema.safeParse({ page: '0' })
      expect(result.success).toBe(false)
    })

    it('should parse year filter', () => {
      const result = exhibitionQuerySchema.parse({ year: '2024' })
      expect(result.year).toBe(2024)
    })

    it('should parse status filter', () => {
      const result = exhibitionQuerySchema.parse({ status: 'PUBLISHED' })
      expect(result.status).toBe('PUBLISHED')
    })

    it('should parse search term', () => {
      const result = exhibitionQuerySchema.parse({ search: 'test' })
      expect(result.search).toBe('test')
    })
  })
})
