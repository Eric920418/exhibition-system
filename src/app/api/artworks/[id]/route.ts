import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateArtworkSchema } from '@/lib/validations/artwork'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/artworks/[id]
 * 獲取單個作品詳情
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    requireAuth(session)

    const { id } = await context.params

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            exhibition: {
              select: {
                id: true,
                name: true,
                year: true,
              },
            },
            members: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 5, // 只取最近 5 個版本
          include: {
            changer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!artwork) {
      return apiError('找不到指定的作品', 404)
    }

    return apiSuccess(artwork)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/artworks/[id]
 * 更新作品資訊（需要權限）
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查作品是否存在
    const artwork = await prisma.artwork.findUnique({
      where: { id },
      select: {
        id: true,
        createdBy: true,
        team: {
          select: {
            id: true,
            leaderId: true,
            exhibition: {
              select: {
                createdBy: true,
              },
            },
            members: true,
          },
        },
      },
    })

    if (!artwork) {
      return apiError('找不到指定的作品', 404)
    }

    // 檢查權限
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const isExhibitionCreator = artwork.team.exhibition.createdBy === user.id
    const isTeamLeader = artwork.team.leaderId === user.id
    const isArtworkCreator = artwork.createdBy === user.id

    if (!isSuperAdmin && !isExhibitionCreator && !isTeamLeader && !isArtworkCreator) {
      return apiError('沒有權限編輯此作品', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateArtworkSchema.parse(body)

    // 更新作品
    const updated = await prisma.artwork.update({
      where: { id },
      data,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return apiSuccess(updated, '作品更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/artworks/[id]
 * 刪除作品（僅超級管理員、展覽創建者或團隊組長）
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await context.params

    // 檢查作品是否存在
    const artwork = await prisma.artwork.findUnique({
      where: { id },
      select: {
        id: true,
        team: {
          select: {
            leaderId: true,
            exhibition: {
              select: {
                createdBy: true,
              },
            },
          },
        },
      },
    })

    if (!artwork) {
      return apiError('找不到指定的作品', 404)
    }

    // 檢查權限（超級管理員、展覽創建者或團隊組長）
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const isExhibitionCreator = artwork.team.exhibition.createdBy === user.id
    const isTeamLeader = artwork.team.leaderId === user.id

    if (!isSuperAdmin && !isExhibitionCreator && !isTeamLeader) {
      return apiError('沒有權限刪除此作品', 403)
    }

    // 刪除作品
    await prisma.artwork.delete({
      where: { id },
    })

    return apiSuccess({ id }, '作品刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
