import { z } from 'zod'

/**
 * 基礎展覽 schema（沒有 refine）
 */
const baseExhibitionSchema = z.object({
  name: z.string().min(1, '展覽名稱不可為空').max(255, '展覽名稱過長'),
  year: z.number().int().min(2000).max(2100),
  slug: z.string().min(1, 'Slug 不可為空').max(255).regex(/^[a-z0-9-]+$/, 'Slug 只能包含小寫字母、數字和連字符'),
  description: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  posterUrl: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().optional()
  ),
})

/**
 * 創建展覽的驗證 schema
 */
export const createExhibitionSchema = baseExhibitionSchema.refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: '結束日期必須晚於開始日期',
  path: ['endDate'],
})

/**
 * 更新展覽的驗證 schema
 */
export const updateExhibitionSchema = baseExhibitionSchema.partial().refine((data) => {
  // 只有在同時提供開始和結束日期時才驗證
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end > start
  }
  return true
}, {
  message: '結束日期必須晚於開始日期',
  path: ['endDate'],
})

/**
 * 查詢展覽列表的驗證 schema
 */
export const exhibitionQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('10'),
  year: z.string().transform(Number).pipe(z.number().int()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
})
