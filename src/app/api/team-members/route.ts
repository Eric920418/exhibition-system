import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createTeamMemberSchema } from '@/lib/validations/team'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/team-members?teamId=xxx
 * 獲取團隊成員列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    const teamId = request.nextUrl.searchParams.get('teamId')

    if (!teamId) {
      return apiError('缺少 teamId 參數', 400)
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { displayOrder: 'asc' },
    })

    return apiSuccess({ members })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/team-members
 * 創建新的團隊成員
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 解析並驗證請求體
    const body = await request.json()
    const data = createTeamMemberSchema.parse(body)

    // 檢查團隊是否存在並獲取權限信息
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
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

    // 檢查權限（超級管理員、展覽創建者或團隊組長可以添加成員）
    if (
      user.role !== 'SUPER_ADMIN' &&
      team.exhibition.createdBy !== user.id &&
      team.leaderId !== user.id
    ) {
      return apiError('沒有權限添加團隊成員', 403)
    }

    // 創建團隊成員
    const member = await prisma.teamMember.create({
      data,
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.TEAM_MEMBER_ADD,
      userId: user.id,
      entityType: 'TeamMember',
      entityId: member.id,
      metadata: {
        teamId: data.teamId,
        memberName: member.name,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(member, '團隊成員添加成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
