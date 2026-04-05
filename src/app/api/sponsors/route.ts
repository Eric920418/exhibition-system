import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createSponsorSchema, sponsorQuerySchema } from '@/lib/validations/sponsor'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { invalidateAdminDashboard } from '@/lib/cache'

/**
 * GET /api/sponsors
 * 獲取贊助商列表（支持分頁、篩選）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { exhibitionId, search, tier, page, limit } = sponsorQuerySchema.parse(searchParams)

    // 構建查詢條件
    const where: any = {}
    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    if (tier) {
      where.tier = tier
    }

    // 搜尋功能：搜尋贊助商名稱和聯絡人
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 計算分頁
    const skip = (page - 1) * limit
    const take = limit

    // 並行查詢總數和數據
    const [total, sponsors] = await Promise.all([
      prisma.sponsor.count({ where }),
      prisma.sponsor.findMany({
        where,
        skip,
        take,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
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
      sponsors,
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
 * POST /api/sponsors
 * 創建新贊助商（僅 SUPER_ADMIN 和 CURATOR）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 驗證權限
    if (!['SUPER_ADMIN', 'CURATOR'].includes(user.role)) {
      return apiError('沒有權限創建贊助商', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createSponsorSchema.parse(body)

    // 檢查展覽是否存在
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: data.exhibitionId },
      select: { id: true, createdBy: true },
    })

    if (!exhibition) {
      return apiError('找不到指定的展覽', 404)
    }

    // 檢查權限（僅創建者或超級管理員可以添加贊助商）
    if (user.role !== 'SUPER_ADMIN' && exhibition.createdBy !== user.id) {
      return apiError('沒有權限為此展覽添加贊助商', 403)
    }

    // 創建贊助商
    const sponsor = await prisma.sponsor.create({
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
      action: 'SPONSOR_CREATE',
      userId: user.id,
      entityType: 'Sponsor',
      entityId: sponsor.id,
      metadata: {
        name: sponsor.name,
        exhibitionId: sponsor.exhibitionId,
      },
      ipAddress,
      userAgent,
    })

    await invalidateAdminDashboard()

    return apiSuccess(sponsor, '贊助商創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
