import { z } from 'zod'

/**
 * 創建作品的驗證 schema
 * 注意：欄位必須與 Prisma Artwork 模型匹配
 */
export const createArtworkSchema = z.object({
  teamId: z.string().uuid('無效的團隊 ID'),
  title: z.string().min(1, '作品標題不可為空').max(255, '作品標題過長'),
  concept: z.string().nullable().optional(),
  mediaUrls: z.array(z.string().url('無效的媒體 URL')).default([]),
  thumbnailUrl: z.string().url('無效的縮圖 URL').nullable().optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isPublished: z.boolean().optional().default(false),
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
  isPublished: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
})
