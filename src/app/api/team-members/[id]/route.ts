import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateTeamMemberSchema } from '@/lib/validations/team'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/team-members/[id]
 * 更新團隊成員資訊
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查成員是否存在
    const member = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            exhibition: {
              select: {
                createdBy: true,
              },
            },
          },
        },
      },
    })

    if (!member) {
      return apiError('找不到指定的團隊成員', 404)
    }

    // 檢查權限
    if (
      user.role !== 'SUPER_ADMIN' &&
      member.team.exhibition.createdBy !== user.id &&
      member.team.leaderId !== user.id
    ) {
      return apiError('沒有權限編輯此團隊成員', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateTeamMemberSchema.parse(body)

    // 更新團隊成員
    const updated = await prisma.teamMember.update({
      where: { id },
      data,
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.TEAM_MEMBER_UPDATE,
      userId: user.id,
      entityType: 'TeamMember',
      entityId: id,
      metadata: {
        updates: data,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(updated, '團隊成員更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/team-members/[id]
 * 刪除團隊成員
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查成員是否存在
    const member = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            exhibition: {
              select: {
                createdBy: true,
              },
            },
          },
        },
      },
    })

    if (!member) {
      return apiError('找不到指定的團隊成員', 404)
    }

    // 檢查權限
    if (
      user.role !== 'SUPER_ADMIN' &&
      member.team.exhibition.createdBy !== user.id &&
      member.team.leaderId !== user.id
    ) {
      return apiError('沒有權限刪除此團隊成員', 403)
    }

    // 刪除團隊成員
    await prisma.teamMember.delete({
      where: { id },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.TEAM_MEMBER_REMOVE,
      userId: user.id,
      entityType: 'TeamMember',
      entityId: id,
      metadata: {
        teamId: member.teamId,
        memberName: member.name,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess({ id }, '團隊成員刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
