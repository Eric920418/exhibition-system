import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateCommentSchema } from '@/lib/validations/board'

interface RouteParams {
  params: Promise<{ cardId: string; commentId: string }>
}

/**
 * GET /api/cards/[cardId]/comments/[commentId]
 * 獲取單個評論詳情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    requireAuth(session)

    const { cardId, commentId } = await params

    const comment = await prisma.cardComment.findFirst({
      where: {
        id: commentId,
        cardId,
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
        card: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!comment) {
      return apiError('評論不存在', 404)
    }

    return apiSuccess(comment)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/cards/[cardId]/comments/[commentId]
 * 更新評論（只能更新自己的評論）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { cardId, commentId } = await params

    // 檢查評論是否存在
    const existingComment = await prisma.cardComment.findFirst({
      where: {
        id: commentId,
        cardId,
      },
    })

    if (!existingComment) {
      return apiError('評論不存在', 404)
    }

    // 檢查是否是評論作者或管理員
    if (existingComment.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限編輯此評論', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateCommentSchema.parse(body)

    // 更新評論
    const comment = await prisma.cardComment.update({
      where: { id: commentId },
      data: {
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

    return apiSuccess(comment, '評論更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/cards/[cardId]/comments/[commentId]
 * 刪除評論（只能刪除自己的評論，或管理員可刪除任何評論）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { cardId, commentId } = await params

    // 檢查評論是否存在
    const existingComment = await prisma.cardComment.findFirst({
      where: {
        id: commentId,
        cardId,
      },
    })

    if (!existingComment) {
      return apiError('評論不存在', 404)
    }

    // 檢查是否是評論作者或管理員
    if (existingComment.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限刪除此評論', 403)
    }

    // 刪除評論
    await prisma.cardComment.delete({
      where: { id: commentId },
    })

    return apiSuccess(null, '評論刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
