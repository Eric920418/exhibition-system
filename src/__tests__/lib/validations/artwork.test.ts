import { describe, it, expect } from 'vitest'
import { createArtworkSchema, updateArtworkSchema, artworkQuerySchema } from '@/lib/validations/artwork'

describe('Artwork Validations', () => {
  describe('createArtworkSchema', () => {
    const validData = {
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      title: '夕陽下的城市',
    }

    it('should validate minimal correct data', () => {
      const result = createArtworkSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate full data', () => {
      const result = createArtworkSchema.safeParse({
        ...validData,
        concept: 'An artistic exploration of urban life',
        mediaUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        displayOrder: 1,
        isPublished: true,
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

    it('should default isPublished to false', () => {
      const result = createArtworkSchema.parse(validData)
      expect(result.isPublished).toBe(false)
    })

    it('should default displayOrder to 0', () => {
      const result = createArtworkSchema.parse(validData)
      expect(result.displayOrder).toBe(0)
    })

    it('should default mediaUrls to empty array', () => {
      const result = createArtworkSchema.parse(validData)
      expect(result.mediaUrls).toEqual([])
    })

    it('should reject negative displayOrder', () => {
      const result = createArtworkSchema.safeParse({ ...validData, displayOrder: -1 })
      expect(result.success).toBe(false)
    })

    it('should reject non-integer displayOrder', () => {
      const result = createArtworkSchema.safeParse({ ...validData, displayOrder: 1.5 })
      expect(result.success).toBe(false)
    })

    it('should reject invalid thumbnailUrl', () => {
      const result = createArtworkSchema.safeParse({ ...validData, thumbnailUrl: 'not-a-url' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid mediaUrls', () => {
      const result = createArtworkSchema.safeParse({ ...validData, mediaUrls: ['not-a-url'] })
      expect(result.success).toBe(false)
    })

    it('should allow null concept', () => {
      const result = createArtworkSchema.safeParse({ ...validData, concept: null })
      expect(result.success).toBe(true)
    })

    it('should allow null thumbnailUrl', () => {
      const result = createArtworkSchema.safeParse({ ...validData, thumbnailUrl: null })
      expect(result.success).toBe(true)
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

    it('should validate isPublished when provided', () => {
      const result = updateArtworkSchema.safeParse({ isPublished: true })
      expect(result.success).toBe(true)
    })

    it('should validate mediaUrls when provided', () => {
      const result = updateArtworkSchema.safeParse({ mediaUrls: ['https://example.com/image.jpg'] })
      expect(result.success).toBe(true)
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

    it('should parse isPublished filter', () => {
      const result = artworkQuerySchema.parse({ isPublished: 'true' })
      expect(result.isPublished).toBe(true)
    })

    it('should parse isPublished false', () => {
      const result = artworkQuerySchema.parse({ isPublished: 'false' })
      expect(result.isPublished).toBe(false)
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
