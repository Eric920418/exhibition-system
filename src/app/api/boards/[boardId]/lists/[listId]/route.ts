import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateListSchema } from '@/lib/validations/board'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

interface RouteParams {
  params: Promise<{ boardId: string; listId: string }>
}

/**
 * GET /api/boards/[boardId]/lists/[listId]
 * 獲取單個列表詳情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { boardId, listId } = await params

    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        boardId,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
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
    })

    if (!list) {
      return apiError('列表不存在', 404)
    }

    return apiSuccess(list)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/boards/[boardId]/lists/[listId]
 * 更新列表
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { boardId, listId } = await params

    // 檢查列表是否存在
    const existingList = await prisma.list.findFirst({
      where: {
        id: listId,
        boardId,
      },
      include: {
        board: {
          select: { name: true },
        },
      },
    })

    if (!existingList) {
      return apiError('列表不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateListSchema.parse(body)

    // 處理位置更新
    if (data.position !== undefined && data.position !== existingList.position) {
      // 重新排序其他列表
      const oldPosition = existingList.position
      const newPosition = data.position

      if (newPosition < oldPosition) {
        // 向前移動：將中間的列表往後移
        await prisma.list.updateMany({
          where: {
            boardId,
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
          },
          data: {
            position: { increment: 1 },
          },
        })
      } else {
        // 向後移動：將中間的列表往前移
        await prisma.list.updateMany({
          where: {
            boardId,
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
          },
          data: {
            position: { decrement: 1 },
          },
        })
      }
    }

    // 更新列表
    const list = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.position !== undefined && { position: data.position }),
      },
      include: {
        cards: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { cards: true },
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.LIST_UPDATE,
      userId: user.id,
      entityType: 'List',
      entityId: list.id,
      metadata: {
        oldTitle: existingList.title,
        newTitle: data.title || existingList.title,
        boardName: existingList.board.name,
        changes: data,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(list, '列表更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/boards/[boardId]/lists/[listId]
 * 刪除列表（會級聯刪除所有卡片）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { boardId, listId } = await params

    // 檢查列表是否存在
    const existingList = await prisma.list.findFirst({
      where: {
        id: listId,
        boardId,
      },
      include: {
        board: {
          select: { name: true },
        },
        _count: {
          select: { cards: true },
        },
      },
    })

    if (!existingList) {
      return apiError('列表不存在', 404)
    }

    // 刪除列表（Prisma 會級聯刪除相關的 cards）
    await prisma.list.delete({
      where: { id: listId },
    })

    // 重新排序剩餘列表
    await prisma.$executeRaw`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 as new_position
        FROM lists
        WHERE board_id = ${boardId}::uuid
      )
      UPDATE lists
      SET position = ranked.new_position
      FROM ranked
      WHERE lists.id = ranked.id
    `

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.LIST_DELETE,
      userId: user.id,
      entityType: 'List',
      entityId: listId,
      metadata: {
        title: existingList.title,
        boardName: existingList.board.name,
        cardsCount: existingList._count.cards,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(null, '列表刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
