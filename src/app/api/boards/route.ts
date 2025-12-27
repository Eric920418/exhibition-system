import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createBoardSchema, boardQuerySchema } from '@/lib/validations/board'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/boards
 * 獲取看板列表（支持分頁、按展覽篩選）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { exhibitionId, page, limit } = boardQuerySchema.parse(searchParams)

    // 構建查詢條件
    const where: any = {}

    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    // 計算分頁
    const skip = (page - 1) * limit
    const take = limit

    // 並行查詢總數和數據
    const [total, boards] = await Promise.all([
      prisma.board.count({ where }),
      prisma.board.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          exhibition: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
          lists: {
            orderBy: { position: 'asc' },
            include: {
              _count: {
                select: { cards: true },
              },
            },
          },
          _count: {
            select: {
              lists: true,
            },
          },
        },
      }),
    ])

    return apiSuccess({
      boards,
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
 * POST /api/boards
 * 創建新看板
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 解析並驗證請求體
    const body = await request.json()
    const data = createBoardSchema.parse(body)

    // 驗證展覽是否存在
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: data.exhibitionId },
    })

    if (!exhibition) {
      return apiError('展覽不存在', 404)
    }

    // 創建看板
    const board = await prisma.board.create({
      data: {
        exhibitionId: data.exhibitionId,
        name: data.name,
        description: data.description,
      },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        lists: true,
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.BOARD_CREATE,
      userId: user.id,
      entityType: 'Board',
      entityId: board.id,
      metadata: {
        name: board.name,
        exhibitionId: board.exhibitionId,
        exhibitionName: exhibition.name,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(board, '看板創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
