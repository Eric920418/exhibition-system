import { z } from 'zod'

/**
 * 創建贊助商驗證 schema
 */
export const createSponsorSchema = z.object({
  exhibitionId: z.string().uuid('無效的展覽 ID'),
  name: z.string().min(1, '贊助商名稱不能為空').max(255, '贊助商名稱過長'),
  logoUrl: z.string().url('無效的 Logo URL').optional(),
  tier: z.string().max(50, '贊助等級過長').optional(),
  websiteUrl: z.string().url('無效的網站 URL').optional(),
  contactName: z.string().max(100, '聯絡人姓名過長').optional(),
  contactEmail: z.string().email('無效的聯絡人 Email').optional(),
  contactPhone: z.string().max(50, '聯絡人電話過長').optional(),
  isContactPublic: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
})

/**
 * 更新贊助商驗證 schema
 */
export const updateSponsorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().url().nullable().optional(),
  tier: z.string().max(50).nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  contactName: z.string().max(100).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(50).nullable().optional(),
  isContactPublic: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
})

/**
 * 贊助商查詢參數驗證
 */
export const sponsorQuerySchema = z.object({
  exhibitionId: z.string().uuid().optional(),
  search: z.string().optional(),
  tier: z.enum(['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'PARTNER']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('50'),
})
