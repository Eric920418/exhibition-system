import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateVenueSchema } from '@/lib/validations/venue'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { invalidateAdminDashboard } from '@/lib/cache'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/venues/[id]
 * 獲取單個場地詳情
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    requireAuth(session)

    const { id } = await context.params

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    })

    if (!venue) {
      return apiError('找不到指定的場地', 404)
    }

    return apiSuccess(venue)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/venues/[id]
 * 更新場地資訊（僅創建者或 SUPER_ADMIN）
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查場地是否存在
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!venue) {
      return apiError('找不到指定的場地', 404)
    }

    // 檢查權限（超級管理員或展覽創建者可以編輯）
    if (user.role !== 'SUPER_ADMIN' && venue.exhibition.createdBy !== user.id) {
      return apiError('沒有權限編輯此場地', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateVenueSchema.parse(body)

    // 更新場地
    const updated = await prisma.venue.update({
      where: { id },
      data,
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: 'VENUE_UPDATE',
      userId: user.id,
      entityType: 'Venue',
      entityId: id,
      metadata: {
        updates: data,
      },
      ipAddress,
      userAgent,
    })

    await invalidateAdminDashboard()

    return apiSuccess(updated, '場地更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/venues/[id]
 * 刪除場地（僅 SUPER_ADMIN 或展覽創建者）
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查場地是否存在
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!venue) {
      return apiError('找不到指定的場地', 404)
    }

    // 檢查權限（僅超級管理員或展覽創建者可以刪除）
    if (user.role !== 'SUPER_ADMIN' && venue.exhibition.createdBy !== user.id) {
      return apiError('沒有權限刪除此場地', 403)
    }

    // 刪除場地
    await prisma.venue.delete({
      where: { id },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: 'VENUE_DELETE',
      userId: user.id,
      entityType: 'Venue',
      entityId: id,
      metadata: {
        name: venue.name,
        exhibitionId: venue.exhibitionId,
      },
      ipAddress,
      userAgent,
    })

    await invalidateAdminDashboard()

    return apiSuccess({ id }, '場地刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
