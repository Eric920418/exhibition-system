import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { validateApiKey, checkApiKeyRateLimit } from '@/lib/api-key'

/**
 * GET /api/public/artworks/[id]
 * 公開端點：查詢單一已發布作品（需 X-API-Key）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { NextResponse } = await import('next/server')
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
    const { id } = await params

    const artwork = await prisma.artwork.findUnique({
      where: { id },
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
    })

    if (!artwork || !artwork.isPublished) {
      return apiError('找不到指定的作品', 404)
    }

    const { creator, isPublished, ...rest } = artwork

    return apiSuccess({
      ...rest,
      creatorName: creator?.name ?? null,
    })
  } catch (error) {
    console.error('Public artwork detail API error:', error)
    return apiError('伺服器錯誤', 500)
  }
}
