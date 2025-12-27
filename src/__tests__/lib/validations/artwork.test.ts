import { describe, it, expect } from 'vitest'
import { createArtworkSchema, updateArtworkSchema, artworkQuerySchema } from '@/lib/validations/artwork'

describe('Artwork Validations', () => {
  describe('createArtworkSchema', () => {
    const validData = {
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      title: '夕陽下的城市',
      category: 'PAINTING' as const,
    }

    it('should validate minimal correct data', () => {
      const result = createArtworkSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate full data', () => {
      const result = createArtworkSchema.safeParse({
        ...validData,
        titleEn: 'City at Sunset',
        description: 'An oil painting depicting urban landscape',
        technicalDetails: 'Oil on canvas',
        materials: 'Oil paint, canvas',
        dimensions: '100x80cm',
        status: 'DRAFT',
        displayOrder: 1,
        coverImageUrl: 'https://example.com/artwork.jpg',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid teamId', () => {
      const result = createArtworkSchema.safeParse({ ...validData, teamId: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('should reject empty title', () => {
      const result = createArtworkSchema.safeParse({ ...validData, title: '' })
      expect(result.success).toBe(false)
    })

    it('should reject long title', () => {
      const result = createArtworkSchema.safeParse({ ...validData, title: 'A'.repeat(256) })
      expect(result.success).toBe(false)
    })

    it('should accept all valid categories', () => {
      const categories = [
        'PAINTING',
        'SCULPTURE',
        'INSTALLATION',
        'PHOTOGRAPHY',
        'VIDEO',
        'DIGITAL',
        'MIXED_MEDIA',
        'PERFORMANCE',
        'OTHER',
      ] as const

      categories.forEach(category => {
        const result = createArtworkSchema.safeParse({ ...validData, category })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid category', () => {
      const result = createArtworkSchema.safeParse({ ...validData, category: 'INVALID' })
      expect(result.success).toBe(false)
    })

    it('should default status to DRAFT', () => {
      const result = createArtworkSchema.parse(validData)
      expect(result.status).toBe('DRAFT')
    })

    it('should accept valid status values', () => {
      const statuses = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const

      statuses.forEach(status => {
        const result = createArtworkSchema.safeParse({ ...validData, status })
        expect(result.success).toBe(true)
      })
    })

    it('should reject negative displayOrder', () => {
      const result = createArtworkSchema.safeParse({ ...validData, displayOrder: -1 })
      expect(result.success).toBe(false)
    })

    it('should reject non-integer displayOrder', () => {
      const result = createArtworkSchema.safeParse({ ...validData, displayOrder: 1.5 })
      expect(result.success).toBe(false)
    })

    it('should reject invalid coverImageUrl', () => {
      const result = createArtworkSchema.safeParse({ ...validData, coverImageUrl: 'not-a-url' })
      expect(result.success).toBe(false)
    })

    it('should reject long materials', () => {
      const result = createArtworkSchema.safeParse({ ...validData, materials: 'A'.repeat(501) })
      expect(result.success).toBe(false)
    })
  })

  describe('updateArtworkSchema', () => {
    it('should allow partial updates', () => {
      const result = updateArtworkSchema.safeParse({ title: 'Updated Title' })
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateArtworkSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should not allow teamId update', () => {
      // @ts-expect-error - testing runtime behavior
      const result = updateArtworkSchema.safeParse({ teamId: '550e8400-e29b-41d4-a716-446655440000' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('teamId')
      }
    })

    it('should validate category when provided', () => {
      const result = updateArtworkSchema.safeParse({ category: 'INVALID' })
      expect(result.success).toBe(false)
    })
  })

  describe('artworkQuerySchema', () => {
    it('should use default values', () => {
      const result = artworkQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should parse teamId filter', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = artworkQuerySchema.parse({ teamId: uuid })
      expect(result.teamId).toBe(uuid)
    })

    it('should reject invalid teamId format', () => {
      const result = artworkQuerySchema.safeParse({ teamId: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('should parse exhibitionId filter', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = artworkQuerySchema.parse({ exhibitionId: uuid })
      expect(result.exhibitionId).toBe(uuid)
    })

    it('should parse category filter', () => {
      const result = artworkQuerySchema.parse({ category: 'PAINTING' })
      expect(result.category).toBe('PAINTING')
    })

    it('should parse status filter', () => {
      const result = artworkQuerySchema.parse({ status: 'APPROVED' })
      expect(result.status).toBe('APPROVED')
    })

    it('should parse search term', () => {
      const result = artworkQuerySchema.parse({ search: 'sunset' })
      expect(result.search).toBe('sunset')
    })

    it('should reject limit above 100', () => {
      const result = artworkQuerySchema.safeParse({ limit: '150' })
      expect(result.success).toBe(false)
    })
  })
})
