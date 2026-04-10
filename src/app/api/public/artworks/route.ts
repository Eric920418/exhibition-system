import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { validateApiKey, checkApiKeyRateLimit } from '@/lib/api-key'
import { getOrSet, CACHE_TTL } from '@/lib/cache'

/**
 * GET /api/public/artworks
 * 公開端點：查詢已發布作品（需 X-API-Key）
 */
export async function GET(request: NextRequest) {
  // 驗證 API Key
  let apiKey: Awaited<ReturnType<typeof validateApiKey>>
  try {
    apiKey = await validateApiKey(request)
  } catch (error) {
    return apiError(error instanceof Error ? error.message : '無效的 API Key', 401)
  }

  // Rate limit
  const rateResult = await checkApiKeyRateLimit(apiKey.keyPrefix, apiKey.rateLimit)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { success: false, error: '請求頻率超過限制，請稍後再試' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Reset': String(rateResult.resetTime),
          'X-RateLimit-Limit': String(apiKey.rateLimit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const page = Math.max(1, parseInt(searchParams.page || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.limit || '20')))
    const teamId = searchParams.teamId
    const exhibitionId = searchParams.exhibitionId
    const search = searchParams.search

    // 強制只回傳已發布作品
    const where: any = { isPublished: true }

    if (teamId) where.teamId = teamId
    if (exhibitionId) where.team = { exhibitionId }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { concept: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit

    const cacheKey = `api:public:artworks:${page}:${limit}:${teamId || ''}:${exhibitionId || ''}:${search || ''}`

    const result = await getOrSet(cacheKey, async () => {
      const [total, artworks] = await Promise.all([
        prisma.artwork.count({ where }),
        prisma.artwork.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            concept: true,
            thumbnailUrl: true,
            mediaUrls: true,
            displayOrder: true,
            createdAt: true,
            updatedAt: true,
            team: {
              select: {
                id: true,
                name: true,
                advisor: true,
                instagramUrl: true,
                exhibition: {
                  select: { id: true, name: true, year: true },
                },
              },
            },
            creator: {
              select: { name: true },
            },
          },
        }),
      ])

      const safeArtworks = artworks.map(({ creator, ...rest }) => ({
        ...rest,
        creatorName: creator?.name ?? null,
      }))

      return {
        artworks: safeArtworks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }, CACHE_TTL.MEDIUM)

    return apiSuccess(result, undefined, 200, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    })
  } catch (error) {
    console.error('Public artworks API error:', error)
    return apiError('伺服器錯誤', 500)
  }
}
