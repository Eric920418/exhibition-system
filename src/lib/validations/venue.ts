import { z } from 'zod'

/**
 * 創建場地驗證 schema
 */
export const createVenueSchema = z.object({
  exhibitionId: z.string().uuid('無效的展覽 ID'),
  name: z.string().min(1, '場地名稱不能為空').max(255, '場地名稱過長'),
  address: z.string().optional(),
  capacity: z.number().int().min(0, '容納人數必須大於 0').optional(),
  floorPlanUrl: z.string().url('無效的平面圖 URL').optional(),
})

/**
 * 更新場地驗證 schema
 */
export const updateVenueSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().nullable().optional(),
  capacity: z.number().int().min(0).nullable().optional(),
  floorPlanUrl: z.string().url().nullable().optional(),
})

/**
 * 場地查詢參數驗證
 */
export const venueQuerySchema = z.object({
  exhibitionId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('50'),
})
