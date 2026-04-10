import { z } from 'zod'

/**
 * 創建團隊驗證 schema
 */
export const createTeamSchema = z.object({
  exhibitionId: z.string().uuid('無效的展覽 ID'),
  name: z.string().min(1, '團隊名稱不能為空').max(255, '團隊名稱過長'),
  slug: z.string()
    .min(1, 'Slug 不能為空')
    .max(255, 'Slug 過長')
    .regex(/^[a-z0-9-]+$/, 'Slug 只能包含小寫字母、數字和連字符'),
  leaderId: z.string().uuid('無效的組長 ID').nullable().optional(),
  description: z.string().nullable().optional(),
  advisor: z.string().max(255).nullable().optional(),
  instagramUrl: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().url('無效的 Instagram 網址').max(255).nullable().optional()
  ),
  teamType: z.enum(['遊戲', '互動', '影視', '行銷', '動畫']).nullable().optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
})

/**
 * 更新團隊驗證 schema
 */
export const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(255).optional(),
  leaderId: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  advisor: z.string().max(255).nullable().optional(),
  instagramUrl: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().url('無效的 Instagram 網址').max(255).nullable().optional()
  ),
  teamType: z.enum(['遊戲', '互動', '影視', '行銷', '動畫']).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
})

/**
 * 團隊查詢參數驗證
 */
export const teamQuerySchema = z.object({
  exhibitionId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
})

/**
 * 創建團隊成員驗證 schema
 */
export const createTeamMemberSchema = z.object({
  teamId: z.string().uuid('無效的團隊 ID'),
  name: z.string().min(1, '成員名稱不能為空').max(100, '成員名稱過長'),
  role: z.string().max(100, '角色名稱過長').optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
})

/**
 * 更新團隊成員驗證 schema
 */
export const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().max(100).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
})
