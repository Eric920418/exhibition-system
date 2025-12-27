import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createListSchema, reorderListsSchema } from '@/lib/validations/board'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

interface RouteParams {
  params: Promise<{ boardId: string }>
}

/**
 * GET /api/boards/[boardId]/lists
 * 獲取看板的所有列表
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { boardId } = await params

    // 驗證看板是否存在
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return apiError('看板不存在', 404)
    }

    const lists = await prisma.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                subtasks: true,
                comments: true,
              },
            },
          },
        },
        _count: {
          select: { cards: true },
        },
      },
    })

    return apiSuccess({ lists })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/boards/[boardId]/lists
 * 創建新列表
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { boardId } = await params

    // 驗證看板是否存在
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return apiError('看板不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createListSchema.parse(body)

    // 獲取當前最大 position
    const maxPositionResult = await prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    })
    const nextPosition = data.position ?? ((maxPositionResult._max.position ?? -1) + 1)

    // 創建列表
    const list = await prisma.list.create({
      data: {
        boardId,
        title: data.title,
        position: nextPosition,
      },
      include: {
        cards: true,
        _count: {
          select: { cards: true },
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.LIST_CREATE,
      userId: user.id,
      entityType: 'List',
      entityId: list.id,
      metadata: {
        title: list.title,
        boardId,
        boardName: board.name,
        position: list.position,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(list, '列表創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/boards/[boardId]/lists
 * 重新排序列表
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { boardId } = await params

    // 驗證看板是否存在
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return apiError('看板不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const { listIds } = reorderListsSchema.parse(body)

    // 驗證所有列表都屬於該看板
    const lists = await prisma.list.findMany({
      where: {
        id: { in: listIds },
        boardId,
      },
    })

    if (lists.length !== listIds.length) {
      return apiError('部分列表不存在或不屬於該看板', 400)
    }

    // 批量更新位置
    await prisma.$transaction(
      listIds.map((listId, index) =>
        prisma.list.update({
          where: { id: listId },
          data: { position: index },
        })
      )
    )

    // 獲取更新後的列表
    const updatedLists = await prisma.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { cards: true },
        },
      },
    })

    return apiSuccess({ lists: updatedLists }, '列表排序更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}
