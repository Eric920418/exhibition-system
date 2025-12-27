import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createVenueSchema, venueQuerySchema } from '@/lib/validations/venue'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/venues
 * 獲取場地列表（支持分頁、篩選）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { exhibitionId, search, page, limit } = venueQuerySchema.parse(searchParams)

    // 構建查詢條件
    const where: any = {}
    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    // 搜尋功能：搜尋場地名稱和地址
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 計算分頁
    const skip = (page - 1) * limit
    const take = limit

    // 並行查詢總數和數據
    const [total, venues] = await Promise.all([
      prisma.venue.count({ where }),
      prisma.venue.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          exhibition: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
        },
      }),
    ])

    return apiSuccess({
      venues,
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
 * POST /api/venues
 * 創建新場地（僅 SUPER_ADMIN 和 CURATOR）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 驗證權限
    if (!['SUPER_ADMIN', 'CURATOR'].includes(user.role)) {
      return apiError('沒有權限創建場地', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createVenueSchema.parse(body)

    // 檢查展覽是否存在
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: data.exhibitionId },
      select: { id: true, createdBy: true },
    })

    if (!exhibition) {
      return apiError('找不到指定的展覽', 404)
    }

    // 檢查權限（僅創建者或超級管理員可以添加場地）
    if (user.role !== 'SUPER_ADMIN' && exhibition.createdBy !== user.id) {
      return apiError('沒有權限為此展覽添加場地', 403)
    }

    // 創建場地
    const venue = await prisma.venue.create({
      data,
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: 'VENUE_CREATE',
      userId: user.id,
      entityType: 'Venue',
      entityId: venue.id,
      metadata: {
        name: venue.name,
        exhibitionId: venue.exhibitionId,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(venue, '場地創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
