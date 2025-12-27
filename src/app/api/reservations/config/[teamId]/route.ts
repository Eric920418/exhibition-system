import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { updateReservationConfigSchema } from '@/lib/validations/reservation'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * GET /api/reservations/config/[teamId]
 * 獲取單一組別的預約設定
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    const config = await prisma.reservationConfig.findUnique({
      where: { teamId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            leaderId: true,
            exhibition: {
              select: {
                id: true,
                name: true,
                year: true,
                createdBy: true,
              },
            },
          },
        },
      },
    })

    if (!config) {
      return apiError('找不到該組別的預約設定', 404)
    }

    // 權限檢查（非管理員需要是展覽創建者或組長）
    if (
      user.role !== 'SUPER_ADMIN' &&
      config.team.exhibition.createdBy !== user.id &&
      config.team.leaderId !== user.id
    ) {
      return apiError('沒有權限查看此預約設定', 403)
    }

    return apiSuccess({
      ...config,
      dailyStartTime: formatTime(config.dailyStartTime),
      dailyEndTime: formatTime(config.dailyEndTime),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/reservations/config/[teamId]
 * 更新預約設定
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    // 只有 SUPER_ADMIN 和 CURATOR 可以更新設定
    if (!['SUPER_ADMIN', 'CURATOR'].includes(user.role)) {
      return apiError('沒有權限更新預約設定', 403)
    }

    // 查詢現有設定
    const existingConfig = await prisma.reservationConfig.findUnique({
      where: { teamId },
      include: {
        team: {
          select: {
            name: true,
            exhibition: {
              select: {
                createdBy: true,
              },
            },
          },
        },
      },
    })

    if (!existingConfig) {
      return apiError('找不到該組別的預約設定', 404)
    }

    // 權限檢查
    if (
      user.role !== 'SUPER_ADMIN' &&
      existingConfig.team.exhibition.createdBy !== user.id
    ) {
      return apiError('沒有權限更新此預約設定', 403)
    }

    const body = await request.json()
    const data = updateReservationConfigSchema.parse(body)

    // 準備更新資料
    const updateData: any = {}

    if (data.slotDurationMinutes !== undefined) {
      updateData.slotDurationMinutes = data.slotDurationMinutes
    }
    if (data.breakDurationMinutes !== undefined) {
      updateData.breakDurationMinutes = data.breakDurationMinutes
    }
    if (data.maxConcurrentCapacity !== undefined) {
      updateData.maxConcurrentCapacity = data.maxConcurrentCapacity
    }
    if (data.dailyStartTime !== undefined) {
      updateData.dailyStartTime = parseTimeToDate(data.dailyStartTime)
    }
    if (data.dailyEndTime !== undefined) {
      updateData.dailyEndTime = parseTimeToDate(data.dailyEndTime)
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    // 更新設定
    const config = await prisma.reservationConfig.update({
      where: { teamId },
      data: updateData,
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
      action: AuditAction.RESERVATION_CONFIG_UPDATE,
      userId: user.id,
      entityType: 'ReservationConfig',
      entityId: config.id,
      metadata: {
        teamId: config.teamId,
        teamName: config.team.name,
        updates: data,
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
      '預約設定更新成功'
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/reservations/config/[teamId]
 * 刪除預約設定
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    // 只有 SUPER_ADMIN 可以刪除設定
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('只有超級管理員可以刪除預約設定', 403)
    }

    // 查詢現有設定
    const existingConfig = await prisma.reservationConfig.findUnique({
      where: { teamId },
      include: {
        team: {
          select: {
            name: true,
            _count: {
              select: {
                reservations: true,
              },
            },
          },
        },
      },
    })

    if (!existingConfig) {
      return apiError('找不到該組別的預約設定', 404)
    }

    // 檢查是否有關聯的預約記錄
    if (existingConfig.team._count.reservations > 0) {
      return apiError(
        `此組別還有 ${existingConfig.team._count.reservations} 筆預約記錄，無法刪除設定`,
        400
      )
    }

    // 刪除設定
    await prisma.reservationConfig.delete({
      where: { teamId },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_CONFIG_DELETE,
      userId: user.id,
      entityType: 'ReservationConfig',
      entityId: existingConfig.id,
      metadata: {
        teamId,
        teamName: existingConfig.team.name,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess({ teamId }, '預約設定刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 將 HH:MM 格式轉換為 Date 物件
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
