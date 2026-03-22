import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'

/**
 * GET /api/teams/public
 * 公開取得組別列表（不需登入），供前台展示使用
 * Query params:
 *   - exhibitionId: 指定展覽 UUID（可選，預設取最新已發布展覽）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const exhibitionId = searchParams.get('exhibitionId')

    let targetExhibitionId = exhibitionId

    // 若未指定展覽，自動找最新已發布的展覽
    if (!targetExhibitionId) {
      const latestExhibition = await prisma.exhibition.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { year: 'desc' },
        select: { id: true },
      })

      if (!latestExhibition) {
        return apiSuccess({ teams: [], exhibition: null })
      }

      targetExhibitionId = latestExhibition.id
    }

    // 確認展覽存在且已發布
    const exhibition = await prisma.exhibition.findFirst({
      where: {
        id: targetExhibitionId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        name: true,
        year: true,
        slug: true,
      },
    })

    if (!exhibition) {
      return apiError('找不到已發布的展覽', 404)
    }

    const teams = await prisma.team.findMany({
      where: { exhibitionId: targetExhibitionId },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        teamType: true,
        description: true,
        advisor: true,
        displayOrder: true,
        members: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        artworks: {
          where: { isPublished: true },
          orderBy: { displayOrder: 'asc' },
          take: 5,
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            mediaUrls: true,
            displayOrder: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    })

    return apiSuccess({ teams, exhibition })
  } catch (error) {
    return handleApiError(error)
  }
}
