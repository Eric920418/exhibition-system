import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createSubtaskSchema, reorderSubtasksSchema } from '@/lib/validations/board'

interface RouteParams {
  params: Promise<{ cardId: string }>
}

/**
 * GET /api/cards/[cardId]/subtasks
 * 獲取卡片的所有子任務
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId } = await params

    // 驗證卡片是否存在
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    })

    if (!card) {
      return apiError('卡片不存在', 404)
    }

    const subtasks = await prisma.subtask.findMany({
      where: { cardId },
      orderBy: { position: 'asc' },
    })

    // 計算完成進度
    const total = subtasks.length
    const completed = subtasks.filter(s => s.completed).length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return apiSuccess({
      subtasks,
      progress: {
        total,
        completed,
        percentage: progress,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/cards/[cardId]/subtasks
 * 創建新子任務
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId } = await params

    // 驗證卡片是否存在
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    })

    if (!card) {
      return apiError('卡片不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createSubtaskSchema.parse(body)

    // 獲取當前最大 position
    const maxPositionResult = await prisma.subtask.aggregate({
      where: { cardId },
      _max: { position: true },
    })
    const nextPosition = data.position ?? ((maxPositionResult._max.position ?? -1) + 1)

    // 創建子任務
    const subtask = await prisma.subtask.create({
      data: {
        cardId,
        title: data.title,
        position: nextPosition,
        completed: false,
      },
    })

    return apiSuccess(subtask, '子任務創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/cards/[cardId]/subtasks
 * 重新排序子任務
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId } = await params

    // 驗證卡片是否存在
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    })

    if (!card) {
      return apiError('卡片不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const { subtaskIds } = reorderSubtasksSchema.parse(body)

    // 驗證所有子任務都屬於該卡片
    const subtasks = await prisma.subtask.findMany({
      where: {
        id: { in: subtaskIds },
        cardId,
      },
    })

    if (subtasks.length !== subtaskIds.length) {
      return apiError('部分子任務不存在或不屬於該卡片', 400)
    }

    // 批量更新位置
    await prisma.$transaction(
      subtaskIds.map((subtaskId, index) =>
        prisma.subtask.update({
          where: { id: subtaskId },
          data: { position: index },
        })
      )
    )

    // 獲取更新後的子任務
    const updatedSubtasks = await prisma.subtask.findMany({
      where: { cardId },
      orderBy: { position: 'asc' },
    })

    return apiSuccess({ subtasks: updatedSubtasks }, '子任務排序更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}
