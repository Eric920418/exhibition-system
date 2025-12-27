import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateSponsorSchema } from '@/lib/validations/sponsor'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/sponsors/[id]
 * 獲取單個贊助商詳情
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    requireAuth(session)

    const { id } = await context.params

    const sponsor = await prisma.sponsor.findUnique({
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

    if (!sponsor) {
      return apiError('找不到指定的贊助商', 404)
    }

    return apiSuccess(sponsor)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/sponsors/[id]
 * 更新贊助商資訊（僅創建者或 SUPER_ADMIN）
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查贊助商是否存在
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!sponsor) {
      return apiError('找不到指定的贊助商', 404)
    }

    // 檢查權限（超級管理員或展覽創建者可以編輯）
    if (user.role !== 'SUPER_ADMIN' && sponsor.exhibition.createdBy !== user.id) {
      return apiError('沒有權限編輯此贊助商', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateSponsorSchema.parse(body)

    // 更新贊助商
    const updated = await prisma.sponsor.update({
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
      action: 'SPONSOR_UPDATE',
      userId: user.id,
      entityType: 'Sponsor',
      entityId: id,
      metadata: {
        updates: data,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(updated, '贊助商更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/sponsors/[id]
 * 刪除贊助商（僅 SUPER_ADMIN 或展覽創建者）
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查贊助商是否存在
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!sponsor) {
      return apiError('找不到指定的贊助商', 404)
    }

    // 檢查權限（僅超級管理員或展覽創建者可以刪除）
    if (user.role !== 'SUPER_ADMIN' && sponsor.exhibition.createdBy !== user.id) {
      return apiError('沒有權限刪除此贊助商', 403)
    }

    // 刪除贊助商
    await prisma.sponsor.delete({
      where: { id },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: 'SPONSOR_DELETE',
      userId: user.id,
      entityType: 'Sponsor',
      entityId: id,
      metadata: {
        name: sponsor.name,
        exhibitionId: sponsor.exhibitionId,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess({ id }, '贊助商刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
