import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createCommentSchema } from '@/lib/validations/board'
import { notifyCardComment } from '@/lib/notification'

interface RouteParams {
  params: Promise<{ cardId: string }>
}

/**
 * GET /api/cards/[cardId]/comments
 * 獲取卡片的所有評論
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

    const comments = await prisma.cardComment.findMany({
      where: { cardId },
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
    })

    return apiSuccess({ comments, total: comments.length })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/cards/[cardId]/comments
 * 創建新評論
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { cardId } = await params

    // 驗證卡片是否存在，並獲取相關用戶
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        assignments: {
          select: { userId: true },
        },
      },
    })

    if (!card) {
      return apiError('卡片不存在', 404)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createCommentSchema.parse(body)

    // 創建評論
    const comment = await prisma.cardComment.create({
      data: {
        cardId,
        userId: user.id,
        content: data.content,
      },
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
    })

    // 發送通知給指派者和創建者（排除評論者自己）
    const recipientIds = new Set<string>()
    card.assignments.forEach((a) => recipientIds.add(a.userId))
    if (card.createdBy) recipientIds.add(card.createdBy)
    recipientIds.delete(user.id) // 排除評論者自己

    if (recipientIds.size > 0) {
      await notifyCardComment({
        cardId,
        cardTitle: card.title,
        commenterName: user.name || '未知用戶',
        commentContent: data.content,
        recipientIds: Array.from(recipientIds),
      })
    }

    return apiSuccess(comment, '評論創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
