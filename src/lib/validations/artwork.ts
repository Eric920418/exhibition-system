import { z } from 'zod'

/**
 * 創建作品的驗證 schema
 */
export const createArtworkSchema = z.object({
  teamId: z.string().uuid('無效的團隊 ID'),
  title: z.string().min(1, '作品標題不可為空').max(255, '作品標題過長'),
  titleEn: z.string().max(255, '英文標題過長').optional(),
  description: z.string().optional(),
  technicalDetails: z.string().optional(),
  materials: z.string().max(500).optional(),
  dimensions: z.string().max(255).optional(),
  category: z.enum([
    'PAINTING',
    'SCULPTURE',
    'INSTALLATION',
    'PHOTOGRAPHY',
    'VIDEO',
    'DIGITAL',
    'MIXED_MEDIA',
    'PERFORMANCE',
    'OTHER'
  ]),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional().default('DRAFT'),
  displayOrder: z.number().int().min(0).optional(),
  coverImageUrl: z.string().url().optional(),
})

/**
 * 更新作品的驗證 schema
 */
export const updateArtworkSchema = createArtworkSchema.partial().omit({ teamId: true })

/**
 * 查詢作品列表的驗證 schema
 */
export const artworkQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('10'),
  teamId: z.string().uuid().optional(),
  exhibitionId: z.string().uuid().optional(),
  category: z.enum([
    'PAINTING',
    'SCULPTURE',
    'INSTALLATION',
    'PHOTOGRAPHY',
    'VIDEO',
    'DIGITAL',
    'MIXED_MEDIA',
    'PERFORMANCE',
    'OTHER'
  ]).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().optional(),
})
