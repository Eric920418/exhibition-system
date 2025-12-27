import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createExhibitionSchema, exhibitionQuerySchema } from '@/lib/validations/exhibition'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/exhibitions
 * 獲取展覽列表（支持分頁、篩選、搜尋）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { page, limit, year, status, search } = exhibitionQuerySchema.parse(searchParams)

    // 構建查詢條件
    const where: any = {}

    if (year) {
      where.year = year
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 計算分頁
    const skip = (page - 1) * limit
    const take = limit

    // 並行查詢總數和數據
    const [total, exhibitions] = await Promise.all([
      prisma.exhibition.count({ where }),
      prisma.exhibition.findMany({
        where,
        skip,
        take,
        orderBy: [
          { year: 'desc' },
          { startDate: 'desc' },
        ],
        select: {
          id: true,
          name: true,
          year: true,
          slug: true,
          description: true,
          startDate: true,
          endDate: true,
          status: true,
          isActive: true,
          posterUrl: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              teams: true,
              members: true,
            },
          },
        },
      }),
    ])

    return apiSuccess({
      exhibitions,
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
 * POST /api/exhibitions
 * 創建新展覽（僅 SUPER_ADMIN 和 CURATOR）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 驗證權限
    if (!['SUPER_ADMIN', 'CURATOR'].includes(user.role)) {
      return apiError('沒有權限創建展覽', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createExhibitionSchema.parse(body)

    // 檢查 slug 是否已存在
    const existing = await prisma.exhibition.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      return apiError('該 Slug 已被使用', 409)
    }

    // 創建展覽
    const exhibition = await prisma.exhibition.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdBy: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.EXHIBITION_CREATE,
      userId: user.id,
      entityType: 'Exhibition',
      entityId: exhibition.id,
      metadata: {
        name: exhibition.name,
        year: exhibition.year,
        slug: exhibition.slug,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(exhibition, '展覽創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
