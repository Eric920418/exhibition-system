import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createCardSchema } from '@/lib/validations/board'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { notifyCardAssigned } from '@/lib/notification'

/**
 * POST /api/cards
 * 創建新卡片
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 解析並驗證請求體
    const body = await request.json()
    const data = createCardSchema.parse(body)

    // 驗證列表是否存在
    const list = await prisma.list.findUnique({
      where: { id: data.listId },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!list) {
      return apiError('列表不存在', 404)
    }

    // 獲取當前最大 position
    const maxPositionResult = await prisma.card.aggregate({
      where: { listId: data.listId },
      _max: { position: true },
    })
    const nextPosition = data.position ?? ((maxPositionResult._max.position ?? -1) + 1)

    // 創建卡片
    const card = await prisma.card.create({
      data: {
        listId: data.listId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        position: nextPosition,
        createdBy: user.id,
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
        subtasks: true,
        _count: {
          select: {
            comments: true,
            subtasks: true,
          },
        },
      },
    })

    // 如果有指派的用戶，創建指派記錄並發送通知
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      await prisma.cardAssignment.createMany({
        data: data.assigneeIds.map((userId) => ({
          cardId: card.id,
          userId,
        })),
        skipDuplicates: true,
      })

      // 發送指派通知（排除創建者自己）
      const assigneesToNotify = data.assigneeIds.filter((id) => id !== user.id)
      if (assigneesToNotify.length > 0) {
        await notifyCardAssigned({
          cardId: card.id,
          cardTitle: card.title,
          assigneeIds: assigneesToNotify,
          assignerName: user.name || '未知用戶',
          boardName: list.board.name,
        })
      }
    }

    // 重新獲取包含指派信息的卡片
    const cardWithAssignments = await prisma.card.findUnique({
      where: { id: card.id },
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
        subtasks: true,
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
      action: AuditAction.CARD_CREATE,
      userId: user.id,
      entityType: 'Card',
      entityId: card.id,
      metadata: {
        title: card.title,
        listId: data.listId,
        listTitle: list.title,
        boardName: list.board.name,
        priority: card.priority,
        dueDate: card.dueDate,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(cardWithAssignments, '卡片創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
