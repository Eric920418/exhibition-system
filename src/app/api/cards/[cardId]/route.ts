import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateCardSchema, moveCardSchema } from '@/lib/validations/board'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { notifyCardAssigned } from '@/lib/notification'

interface RouteParams {
  params: Promise<{ cardId: string }>
}

/**
 * GET /api/cards/[cardId]
 * 獲取單張卡片詳情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId } = await params

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              select: {
                id: true,
                name: true,
                exhibitionId: true,
              },
            },
          },
        },
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
        comments: {
          orderBy: { createdAt: 'desc' },
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
      },
    })

    if (!card) {
      return apiError('卡片不存在', 404)
    }

    return apiSuccess(card)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/cards/[cardId]
 * 更新卡片
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { cardId } = await params

    // 檢查卡片是否存在
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              select: { name: true },
            },
          },
        },
        assignments: true,
      },
    })

    if (!existingCard) {
      return apiError('卡片不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()

    // 檢查是否是移動卡片的操作
    if (body.targetListId !== undefined) {
      const moveData = moveCardSchema.parse(body)
      return await moveCard(request, cardId, existingCard, moveData, user)
    }

    const data = updateCardSchema.parse(body)

    // 更新卡片
    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.position !== undefined && { position: data.position }),
      },
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
    })

    // 如果有更新指派的用戶
    if (data.assigneeIds !== undefined) {
      // 獲取現有指派的用戶ID
      const existingAssigneeIds = existingCard.assignments.map((a) => a.userId)

      // 刪除現有的指派
      await prisma.cardAssignment.deleteMany({
        where: { cardId },
      })

      // 創建新的指派
      if (data.assigneeIds.length > 0) {
        await prisma.cardAssignment.createMany({
          data: data.assigneeIds.map((userId) => ({
            cardId,
            userId,
          })),
          skipDuplicates: true,
        })

        // 找出新增的指派者（排除自己）
        const newAssigneeIds = data.assigneeIds.filter(
          (id) => !existingAssigneeIds.includes(id) && id !== user.id
        )

        // 發送通知給新增的指派者
        if (newAssigneeIds.length > 0) {
          await notifyCardAssigned({
            cardId,
            cardTitle: existingCard.title,
            assigneeIds: newAssigneeIds,
            assignerName: user.name || '未知用戶',
            boardName: existingCard.list.board.name,
          })
        }
      }
    }

    // 獲取更新後的卡片
    const updatedCard = await prisma.card.findUnique({
      where: { id: cardId },
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
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.CARD_UPDATE,
      userId: user.id,
      entityType: 'Card',
      entityId: card.id,
      metadata: {
        oldTitle: existingCard.title,
        newTitle: data.title || existingCard.title,
        changes: data,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(updatedCard, '卡片更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 移動卡片到另一個列表
 */
async function moveCard(
  request: NextRequest,
  cardId: string,
  existingCard: any,
  moveData: { targetListId: string; position: number },
  user: any
) {
  // 驗證目標列表是否存在且在同一個看板
  const targetList = await prisma.list.findUnique({
    where: { id: moveData.targetListId },
    include: {
      board: {
        select: { id: true, name: true },
      },
    },
  })

  if (!targetList) {
    return apiError('目標列表不存在', 404)
  }

  // 確認目標列表和原列表在同一個看板
  if (targetList.board.id !== existingCard.list.board.id) {
    return apiError('不能跨看板移動卡片', 400)
  }

  const oldListId = existingCard.listId
  const newListId = moveData.targetListId
  const newPosition = moveData.position

  await prisma.$transaction(async (tx) => {
    // 如果是在同一個列表內移動
    if (oldListId === newListId) {
      const oldPosition = existingCard.position

      if (newPosition < oldPosition) {
        // 向前移動
        await tx.card.updateMany({
          where: {
            listId: oldListId,
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
          },
          data: {
            position: { increment: 1 },
          },
        })
      } else if (newPosition > oldPosition) {
        // 向後移動
        await tx.card.updateMany({
          where: {
            listId: oldListId,
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
    } else {
      // 跨列表移動
      // 1. 從原列表移除後，更新原列表其他卡片的位置
      await tx.card.updateMany({
        where: {
          listId: oldListId,
          position: { gt: existingCard.position },
        },
        data: {
          position: { decrement: 1 },
        },
      })

      // 2. 在目標列表中騰出位置
      await tx.card.updateMany({
        where: {
          listId: newListId,
          position: { gte: newPosition },
        },
        data: {
          position: { increment: 1 },
        },
      })
    }

    // 更新卡片的列表和位置
    await tx.card.update({
      where: { id: cardId },
      data: {
        listId: newListId,
        position: newPosition,
      },
    })
  })

  // 獲取更新後的卡片
  const movedCard = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: {
        select: {
          id: true,
          title: true,
        },
      },
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
  })

  // 記錄審計日誌
  const { ipAddress, userAgent } = extractRequestInfo(request)
  await createAuditLog({
    action: AuditAction.CARD_MOVE,
    userId: user.id,
    entityType: 'Card',
    entityId: cardId,
    metadata: {
      title: existingCard.title,
      fromListId: oldListId,
      fromListTitle: existingCard.list.title,
      toListId: newListId,
      toListTitle: targetList.title,
      newPosition,
    },
    ipAddress,
    userAgent,
  })

  return apiSuccess(movedCard, '卡片移動成功')
}

/**
 * DELETE /api/cards/[cardId]
 * 刪除卡片
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { cardId } = await params

    // 檢查卡片是否存在
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              select: { name: true },
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
    })

    if (!existingCard) {
      return apiError('卡片不存在', 404)
    }

    const listId = existingCard.listId
    const position = existingCard.position

    // 刪除卡片
    await prisma.card.delete({
      where: { id: cardId },
    })

    // 重新排序剩餘卡片
    await prisma.card.updateMany({
      where: {
        listId,
        position: { gt: position },
      },
      data: {
        position: { decrement: 1 },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.CARD_DELETE,
      userId: user.id,
      entityType: 'Card',
      entityId: cardId,
      metadata: {
        title: existingCard.title,
        listTitle: existingCard.list.title,
        boardName: existingCard.list.board.name,
        subtasksCount: existingCard._count.subtasks,
        commentsCount: existingCard._count.comments,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(null, '卡片刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
