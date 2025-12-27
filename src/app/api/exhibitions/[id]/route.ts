import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateExhibitionSchema } from '@/lib/validations/exhibition'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/exhibitions/[id]
 * 獲取單個展覽詳情
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    requireAuth(session)

    const { id } = await context.params

    const exhibition = await prisma.exhibition.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        teams: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                members: true,
                artworks: true,
              },
            },
          },
        },
        sponsors: true,
        venues: true,
        _count: {
          select: {
            documents: true,
            boards: true,
          },
        },
      },
    })

    if (!exhibition) {
      return apiError('找不到指定的展覽', 404)
    }

    return apiSuccess(exhibition)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/exhibitions/[id]
 * 更新展覽資訊（僅創建者或 SUPER_ADMIN）
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查展覽是否存在
    const exhibition = await prisma.exhibition.findUnique({
      where: { id },
      select: { id: true, createdBy: true, slug: true },
    })

    if (!exhibition) {
      return apiError('找不到指定的展覽', 404)
    }

    // 檢查權限（僅創建者或超級管理員可以編輯）
    if (user.role !== 'SUPER_ADMIN' && exhibition.createdBy !== user.id) {
      return apiError('沒有權限編輯此展覽', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateExhibitionSchema.parse(body)

    // 如果更新 slug，檢查是否已存在
    if (data.slug && data.slug !== exhibition.slug) {
      const existing = await prisma.exhibition.findUnique({
        where: { slug: data.slug },
      })

      if (existing && existing.id !== id) {
        return apiError('該 Slug 已被使用', 409)
      }
    }

    // 更新展覽
    const updated = await prisma.exhibition.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.EXHIBITION_UPDATE,
      userId: user.id,
      entityType: 'Exhibition',
      entityId: id,
      metadata: {
        updates: data,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(updated, '展覽更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/exhibitions/[id]
 * 刪除展覽（僅 SUPER_ADMIN）
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 僅超級管理員可以刪除
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限刪除展覽', 403)
    }

    const { id } = await context.params

    // 檢查展覽是否存在
    const exhibition = await prisma.exhibition.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            teams: true,
            members: true,
          },
        },
      },
    })

    if (!exhibition) {
      return apiError('找不到指定的展覽', 404)
    }

    // 檢查是否有關聯數據（防止誤刪）
    if (exhibition._count.teams > 0 || exhibition._count.members > 0) {
      return apiError('此展覽還有關聯的團隊或成員，無法刪除', 400)
    }

    // 刪除展覽
    await prisma.exhibition.delete({
      where: { id },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.EXHIBITION_DELETE,
      userId: user.id,
      entityType: 'Exhibition',
      entityId: id,
      ipAddress,
      userAgent,
    })

    return apiSuccess({ id }, '展覽刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
