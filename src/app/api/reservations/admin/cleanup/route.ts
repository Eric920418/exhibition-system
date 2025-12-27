import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReservationStatus } from '@prisma/client'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { formatDateString } from '@/lib/reservation-utils'

/**
 * POST /api/reservations/admin/cleanup
 * 批量處理未完成預約（需認證 - 僅管理員）
 *
 * 將所有 WAITING 和 CALLED 狀態的預約標記為 NO_SHOW
 * 用於當日結束時清理未完成的預約
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 只有 SUPER_ADMIN 可以執行批量清理
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限執行此操作', 403)
    }

    const body = await request.json().catch(() => ({}))
    const { teamId, date } = body

    // 使用指定日期或默認為今天
    const targetDate = date
      ? new Date(date + 'T00:00:00.000Z')
      : new Date(formatDateString(new Date()) + 'T00:00:00.000Z')

    // 構建查詢條件
    const where: {
      reservationDate: Date
      status: { in: ReservationStatus[] }
      teamId?: string
    } = {
      reservationDate: targetDate,
      status: { in: [ReservationStatus.WAITING, ReservationStatus.CALLED] },
    }

    if (teamId) {
      // 驗證 teamId 是否存在
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      })
      if (!team) {
        return apiError('找不到指定的組別', 404)
      }
      where.teamId = teamId
    }

    // 獲取受影響的預約數量
    const countBefore = await prisma.reservation.count({ where })

    if (countBefore === 0) {
      return apiSuccess(
        {
          processed: 0,
          date: formatDateString(targetDate),
        },
        '沒有需要處理的預約'
      )
    }

    // 批量更新為 NO_SHOW
    const result = await prisma.reservation.updateMany({
      where,
      data: {
        status: 'NO_SHOW',
      },
    })

    // 清理 CurrentServing 記錄
    if (teamId) {
      await prisma.currentServing.update({
        where: { teamId },
        data: { servingReservationId: null },
      })
    } else {
      // 清理所有受影響組別的 CurrentServing
      const affectedTeams = await prisma.reservation.findMany({
        where: {
          reservationDate: targetDate,
          status: 'NO_SHOW',
        },
        select: { teamId: true },
        distinct: ['teamId'],
      })

      for (const team of affectedTeams) {
        await prisma.currentServing.updateMany({
          where: { teamId: team.teamId },
          data: { servingReservationId: null },
        })
      }
    }

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_BATCH_CLEANUP,
      userId: user.id,
      entityType: 'Reservation',
      entityId: teamId || 'all',
      metadata: {
        date: formatDateString(targetDate),
        processedCount: result.count,
        teamId: teamId || 'all',
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        processed: result.count,
        date: formatDateString(targetDate),
        teamId: teamId || null,
      },
      `已將 ${result.count} 筆預約標記為未到場`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
