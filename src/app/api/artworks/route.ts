import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createArtworkSchema, artworkQuerySchema } from '@/lib/validations/artwork'
import { invalidateAdminDashboard } from '@/lib/cache'

/**
 * GET /api/artworks
 * 獲取作品列表（支持分頁、篩選、搜尋）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const page = parseInt(searchParams.page || '1')
    const limit = parseInt(searchParams.limit || '10')
    const teamId = searchParams.teamId
    const exhibitionId = searchParams.exhibitionId
    const search = searchParams.search
    const isPublished = searchParams.isPublished

    // 構建查詢條件
    const where: any = {}

    if (teamId) {
      where.teamId = teamId
    }

    if (exhibitionId) {
      where.team = {
        exhibitionId,
      }
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true'
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { concept: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 計算分頁
    const skip = (page - 1) * limit
    const take = limit

    // 並行查詢總數和數據
    const [total, artworks] = await Promise.all([
      prisma.artwork.count({ where }),
      prisma.artwork.findMany({
        where,
        skip,
        take,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          concept: true,
          thumbnailUrl: true,
          mediaUrls: true,
          displayOrder: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
              exhibition: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ])

    return apiSuccess({
      artworks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/artworks
 * 創建新作品（需要是團隊成員或管理員）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 解析並驗證請求體
    const body = await request.json()
    const data = createArtworkSchema.parse(body)

    // 檢查團隊是否存在
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      select: {
        id: true,
        leaderId: true,
        exhibition: {
          select: {
            id: true,
            createdBy: true,
          },
        },
      },
    })

    if (!team) {
      return apiError('找不到指定的團隊', 404)
    }

    // 檢查權限（超級管理員、展覽創建者、團隊組長）
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const isExhibitionCreator = team.exhibition.createdBy === user.id
    const isTeamLeader = team.leaderId === user.id

    if (!isSuperAdmin && !isExhibitionCreator && !isTeamLeader) {
      return apiError('沒有權限為此團隊創建作品', 403)
    }

    // 創建作品
    const artwork = await prisma.artwork.create({
      data: {
        ...data,
        createdBy: user.id,
      },
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

    await invalidateAdminDashboard()

    return apiSuccess(artwork, '作品創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
