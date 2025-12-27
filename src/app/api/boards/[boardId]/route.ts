import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateBoardSchema } from '@/lib/validations/board'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

interface RouteParams {
  params: Promise<{ boardId: string }>
}

/**
 * GET /api/boards/[boardId]
 * 獲取單個看板詳情（包含所有列表和卡片）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { boardId } = await params

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
            slug: true,
          },
        },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
                assignments: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
                subtasks: {
                  orderBy: { position: 'asc' },
                },
                _count: {
                  select: {
                    comments: true,
                    subtasks: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!board) {
      return apiError('看板不存在', 404)
    }

    return apiSuccess(board)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/boards/[boardId]
 * 更新看板
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { boardId } = await params

    // 檢查看板是否存在
    const existingBoard = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        exhibition: {
          select: { name: true },
        },
      },
    })

    if (!existingBoard) {
      return apiError('看板不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateBoardSchema.parse(body)

    // 更新看板
    const board = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
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
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.BOARD_UPDATE,
      userId: user.id,
      entityType: 'Board',
      entityId: board.id,
      metadata: {
        oldName: existingBoard.name,
        newName: data.name || existingBoard.name,
        changes: data,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(board, '看板更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/boards/[boardId]
 * 刪除看板（會級聯刪除所有列表和卡片）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { boardId } = await params

    // 檢查看板是否存在
    const existingBoard = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        exhibition: {
          select: { name: true },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
    })

    if (!existingBoard) {
      return apiError('看板不存在', 404)
    }

    // 刪除看板（Prisma 會級聯刪除相關的 lists 和 cards）
    await prisma.board.delete({
      where: { id: boardId },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.BOARD_DELETE,
      userId: user.id,
      entityType: 'Board',
      entityId: boardId,
      metadata: {
        name: existingBoard.name,
        exhibitionName: existingBoard.exhibition.name,
        listsCount: existingBoard._count.lists,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(null, '看板刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
