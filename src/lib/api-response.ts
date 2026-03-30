import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * API 響應類型
 */
export type ApiResponse<T = any> = {
  success: true
  data: T
  message?: string
} | {
  success: false
  error: string
  details?: any
}

/**
 * 成功響應
 */
export function apiSuccess<T>(data: T, message?: string, status = 200, headers?: Record<string, string>) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status, headers }
  )
}

/**
 * 錯誤響應
 */
export function apiError(error: string, status = 400, details?: any) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * 統一錯誤處理
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Zod 驗證錯誤
  if (error instanceof ZodError) {
    return apiError(
      '輸入資料驗證失敗',
      400,
      error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    )
  }

  // Prisma 錯誤
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any }

    switch (prismaError.code) {
      case 'P2002':
        return apiError('資料已存在，違反唯一性約束', 409)
      case 'P2025':
        return apiError('找不到指定的資料', 404)
      case 'P2003':
        return apiError('關聯資料不存在', 400)
      default:
        return apiError('資料庫操作失敗', 500)
    }
  }

  // 一般錯誤
  if (error instanceof Error) {
    return apiError(error.message, 500)
  }

  return apiError('未知錯誤', 500)
}

/**
 * 驗證用戶認證
 */
export function requireAuth(session: any) {
  if (!session?.user) {
    throw new Error('未登入或登入已過期')
  }
  return session.user
}

/**
 * 驗證用戶角色
 */
export function requireRole(user: any, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error('沒有權限執行此操作')
  }
}
