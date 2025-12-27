import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createTeamSchema, teamQuerySchema } from '@/lib/validations/team'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/teams
 * 獲取團隊列表（支持分頁、篩選）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { exhibitionId, search, page, limit } = teamQuerySchema.parse(searchParams)

    // 構建查詢條件
    const where: any = {}
    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    // 搜尋功能：搜尋團隊名稱和描述
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 計算分頁
    const skip = (page - 1) * limit
    const take = limit

    // 並行查詢總數和數據
    const [total, teams] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        skip,
        take,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
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
          _count: {
            select: {
              members: true,
              artworks: true,
            },
          },
        },
      }),
    ])

    return apiSuccess({
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/teams
 * 創建新團隊（僅 SUPER_ADMIN 和 CURATOR）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 驗證權限
    if (!['SUPER_ADMIN', 'CURATOR'].includes(user.role)) {
      return apiError('沒有權限創建團隊', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createTeamSchema.parse(body)

    // 檢查展覽是否存在
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: data.exhibitionId },
      select: { id: true, createdBy: true },
    })

    if (!exhibition) {
      return apiError('找不到指定的展覽', 404)
    }

    // 檢查權限（僅創建者或超級管理員可以添加團隊）
    if (user.role !== 'SUPER_ADMIN' && exhibition.createdBy !== user.id) {
      return apiError('沒有權限為此展覽添加團隊', 403)
    }

    // 檢查 slug 是否已存在（同一展覽內）
    const existing = await prisma.team.findUnique({
      where: {
        exhibitionId_slug: {
          exhibitionId: data.exhibitionId,
          slug: data.slug,
        },
      },
    })

    if (existing) {
      return apiError('該 Slug 在此展覽中已被使用', 409)
    }

    // 如果指定了組長，檢查組長是否存在
    if (data.leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: data.leaderId },
      })

      if (!leader) {
        return apiError('找不到指定的組長', 404)
      }
    }

    // 創建團隊
    const team = await prisma.team.create({
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
      action: AuditAction.TEAM_CREATE,
      userId: user.id,
      entityType: 'Team',
      entityId: team.id,
      metadata: {
        name: team.name,
        exhibitionId: team.exhibitionId,
        slug: team.slug,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(team, '團隊創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
