import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateSubtaskSchema } from '@/lib/validations/board'

interface RouteParams {
  params: Promise<{ cardId: string; subtaskId: string }>
}

/**
 * GET /api/cards/[cardId]/subtasks/[subtaskId]
 * 獲取單個子任務詳情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId, subtaskId } = await params

    const subtask = await prisma.subtask.findFirst({
      where: {
        id: subtaskId,
        cardId,
      },
      include: {
        card: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!subtask) {
      return apiError('子任務不存在', 404)
    }

    return apiSuccess(subtask)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/cards/[cardId]/subtasks/[subtaskId]
 * 更新子任務
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId, subtaskId } = await params

    // 檢查子任務是否存在
    const existingSubtask = await prisma.subtask.findFirst({
      where: {
        id: subtaskId,
        cardId,
      },
    })

    if (!existingSubtask) {
      return apiError('子任務不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateSubtaskSchema.parse(body)

    // 處理位置更新
    if (data.position !== undefined && data.position !== existingSubtask.position) {
      const oldPosition = existingSubtask.position
      const newPosition = data.position

      if (newPosition < oldPosition) {
        await prisma.subtask.updateMany({
          where: {
            cardId,
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
        await prisma.subtask.updateMany({
          where: {
            cardId,
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

    // 更新子任務
    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.position !== undefined && { position: data.position }),
      },
    })

    return apiSuccess(subtask, '子任務更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/cards/[cardId]/subtasks/[subtaskId]
 * 刪除子任務
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId, subtaskId } = await params

    // 檢查子任務是否存在
    const existingSubtask = await prisma.subtask.findFirst({
      where: {
        id: subtaskId,
        cardId,
      },
    })

    if (!existingSubtask) {
      return apiError('子任務不存在', 404)
    }

    const position = existingSubtask.position

    // 刪除子任務
    await prisma.subtask.delete({
      where: { id: subtaskId },
    })

    // 重新排序剩餘子任務
    await prisma.subtask.updateMany({
      where: {
        cardId,
        position: { gt: position },
      },
      data: {
        position: { decrement: 1 },
      },
    })

    return apiSuccess(null, '子任務刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
