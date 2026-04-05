import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateTeamSchema } from '@/lib/validations/team'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { invalidateAdminDashboard } from '@/lib/cache'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/teams/[id]
 * 獲取單個團隊詳情
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    requireAuth(session)

    const { id } = await context.params

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
            status: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        members: {
          orderBy: { displayOrder: 'asc' },
        },
        artworks: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            isPublished: true,
            createdAt: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            members: true,
            artworks: true,
            reservations: true,
          },
        },
      },
    })

    if (!team) {
      return apiError('找不到指定的團隊', 404)
    }

    return apiSuccess(team)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/teams/[id]
 * 更新團隊資訊（僅創建者、組長或 SUPER_ADMIN）
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查團隊是否存在
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!team) {
      return apiError('找不到指定的團隊', 404)
    }

    // 檢查權限（超級管理員、展覽創建者或團隊組長可以編輯）
    if (
      user.role !== 'SUPER_ADMIN' &&
      team.exhibition.createdBy !== user.id &&
      team.leaderId !== user.id
    ) {
      return apiError('沒有權限編輯此團隊', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateTeamSchema.parse(body)

    // 如果更新 slug，檢查是否已存在
    if (data.slug && data.slug !== team.slug) {
      const existing = await prisma.team.findUnique({
        where: {
          exhibitionId_slug: {
            exhibitionId: team.exhibitionId,
            slug: data.slug,
          },
        },
      })

      if (existing && existing.id !== id) {
        return apiError('該 Slug 在此展覽中已被使用', 409)
      }
    }

    // 如果更新組長，檢查組長是否存在
    if (data.leaderId !== undefined && data.leaderId !== null) {
      const leader = await prisma.user.findUnique({
        where: { id: data.leaderId },
      })

      if (!leader) {
        return apiError('找不到指定的組長', 404)
      }
    }

    // 更新團隊
    const updated = await prisma.team.update({
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
        leader: {
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
      action: AuditAction.TEAM_UPDATE,
      userId: user.id,
      entityType: 'Team',
      entityId: id,
      metadata: {
        updates: data,
      },
      ipAddress,
      userAgent,
    })

    await invalidateAdminDashboard()

    return apiSuccess(updated, '團隊更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/teams/[id]
 * 刪除團隊（僅 SUPER_ADMIN 或展覽創建者）
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查團隊是否存在
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
        _count: {
          select: {
            members: true,
            artworks: true,
          },
        },
      },
    })

    if (!team) {
      return apiError('找不到指定的團隊', 404)
    }

    // 檢查權限（僅超級管理員或展覽創建者可以刪除）
    if (user.role !== 'SUPER_ADMIN' && team.exhibition.createdBy !== user.id) {
      return apiError('沒有權限刪除此團隊', 403)
    }

    // 檢查是否有關聯數據（防止誤刪）
    if (team._count.artworks > 0) {
      return apiError('此團隊還有關聯的作品，無法刪除', 400)
    }

    // 刪除團隊（會級聯刪除成員）
    await prisma.team.delete({
      where: { id },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.TEAM_DELETE,
      userId: user.id,
      entityType: 'Team',
      entityId: id,
      metadata: {
        name: team.name,
        exhibitionId: team.exhibitionId,
      },
      ipAddress,
      userAgent,
    })

    await invalidateAdminDashboard()

    return apiSuccess({ id }, '團隊刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
