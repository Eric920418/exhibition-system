import { z } from 'zod'
import { UserRole } from '@prisma/client'

/**
 * 創建用戶驗證 schema（僅超級管理員）
 */
export const createUserSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(6, '密碼至少需要 6 個字元'),
  name: z.string().min(2, '姓名至少需要 2 個字元').max(100, '姓名過長'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: '無效的角色' }) }),
  avatarUrl: z.string().url('無效的頭像 URL').optional(),
  isActive: z.boolean().optional().default(true),
})

/**
 * 更新用戶驗證 schema
 */
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(), // 僅在需要重置密碼時提供
})

/**
 * 用戶查詢參數驗證
 */
export const userQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
})

/**
 * 更改密碼驗證 schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '請輸入當前密碼'),
  newPassword: z.string().min(6, '新密碼至少需要 6 個字元'),
})
