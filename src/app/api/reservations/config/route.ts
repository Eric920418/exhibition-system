import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import {
  createReservationConfigSchema,
  reservationConfigQuerySchema,
} from '@/lib/validations/reservation'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/reservations/config
 * 獲取預約設定列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { exhibitionId, isActive, page, limit } = reservationConfigQuerySchema.parse(searchParams)

    // 構建查詢條件
    const where: any = {}

    if (exhibitionId) {
      where.team = {
        exhibitionId,
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // 非 SUPER_ADMIN 只能看自己有權限的展覽
    if (user.role !== 'SUPER_ADMIN') {
      where.team = {
        ...where.team,
        exhibition: {
          OR: [
            { createdBy: user.id },
            {
              members: {
                some: { userId: user.id },
              },
            },
          ],
        },
      }
    }

    const skip = (page - 1) * limit

    const [total, configs] = await Promise.all([
      prisma.reservationConfig.count({ where }),
      prisma.reservationConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              exhibition: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                },
              },
            },
          },
        },
      }),
    ])

    // 格式化時間欄位
    const formattedConfigs = configs.map((config) => ({
      ...config,
      dailyStartTime: formatTime(config.dailyStartTime),
      dailyEndTime: formatTime(config.dailyEndTime),
    }))

    return apiSuccess({
      configs: formattedConfigs,
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
 * POST /api/reservations/config
 * 創建預約設定
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 只有 SUPER_ADMIN 和 CURATOR 可以創建設定
    if (!['SUPER_ADMIN', 'CURATOR'].includes(user.role)) {
      return apiError('沒有權限創建預約設定', 403)
    }

    const body = await request.json()
    const data = createReservationConfigSchema.parse(body)

    // 檢查組別是否存在
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        exhibition: {
          select: {
            id: true,
            createdBy: true,
          },
        },
        reservationConfig: true,
      },
    })

    if (!team) {
      return apiError('找不到指定的組別', 404)
    }

    // 權限檢查
    if (user.role !== 'SUPER_ADMIN' && team.exhibition.createdBy !== user.id) {
      return apiError('沒有權限為此組別創建預約設定', 403)
    }

    // 檢查是否已有設定
    if (team.reservationConfig) {
      return apiError('此組別已有預約設定，請使用更新功能', 409)
    }

    // 轉換時間格式
    const dailyStartTime = parseTimeToDate(data.dailyStartTime)
    const dailyEndTime = parseTimeToDate(data.dailyEndTime)

    // 創建設定
    const config = await prisma.reservationConfig.create({
      data: {
        teamId: data.teamId,
        slotDurationMinutes: data.slotDurationMinutes,
        breakDurationMinutes: data.breakDurationMinutes,
        maxConcurrentCapacity: data.maxConcurrentCapacity,
        dailyStartTime,
        dailyEndTime,
        isActive: data.isActive,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            exhibition: {
              select: {
                id: true,
                name: true,
                year: true,
              },
            },
          },
        },
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_CONFIG_CREATE,
      userId: user.id,
      entityType: 'ReservationConfig',
      entityId: config.id,
      metadata: {
        teamId: config.teamId,
        teamName: config.team.name,
        slotDurationMinutes: config.slotDurationMinutes,
        maxConcurrentCapacity: config.maxConcurrentCapacity,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        ...config,
        dailyStartTime: formatTime(config.dailyStartTime),
        dailyEndTime: formatTime(config.dailyEndTime),
      },
      '預約設定創建成功',
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 將 HH:MM 格式轉換為 Date 物件（只取時間部分）
 */
function parseTimeToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date('1970-01-01T00:00:00.000Z')
  date.setUTCHours(hours, minutes, 0, 0)
  return date
}

/**
 * 將 Date 物件轉換為 HH:MM 格式
 */
function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
