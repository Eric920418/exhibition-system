import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { getAuditLogs, cleanupOldAuditLogs } from '@/lib/audit-log'

/**
 * 查詢參數驗證 schema
 */
const auditLogQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('50'),
})

/**
 * GET /api/audit-logs
 * 查詢審計日誌（僅 SUPER_ADMIN 可訪問）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 僅超級管理員可以查看審計日誌
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限查看審計日誌', 403)
    }

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const {
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      page,
      limit,
    } = auditLogQuerySchema.parse(searchParams)

    // 查詢審計日誌
    const result = await getAuditLogs({
      userId,
      entityType,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/audit-logs/cleanup
 * 清理舊的審計日誌（僅 SUPER_ADMIN 可執行）
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 僅超級管理員可以清理審計日誌
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限清理審計日誌', 403)
    }

    // 解析請求體
    const body = await request.json()
    const daysToKeep = body.daysToKeep || 90

    if (daysToKeep < 30) {
      return apiError('保留天數不能少於 30 天', 400)
    }

    // 執行清理
    const deletedCount = await cleanupOldAuditLogs(daysToKeep)

    return apiSuccess(
      {
        deletedCount,
        daysToKeep,
      },
      `已清理 ${deletedCount} 條審計日誌`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
